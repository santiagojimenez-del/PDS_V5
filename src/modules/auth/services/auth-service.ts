import { db } from "@/lib/db";
import { users, userMeta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, generateToken, generateVerificationCode, encrypt, hashPassword, decrypt } from "@/lib/auth/crypto";
import {
  addUserToken,
  removeUserTokens,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth/session";
import { TOKEN_EXPIRY, ROLES } from "@/lib/constants";
import type { AuthUser, SessionToken, VerificationToken, UserToken, PasswordResetToken } from "../types";
import { emailService } from "@/modules/email";

interface LoginResult {
  success: boolean;
  error?: string;
  requires2FA?: boolean;
  verificationToken?: string;
  user?: AuthUser;
}

function buildMetaMap(meta: { metaKey: string; metaValue: string | null }[]): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const m of meta) {
    map[m.metaKey] = m.metaValue;
  }
  return map;
}

function parseTokens(raw: unknown): UserToken[] {
  if (!raw) return [];
  if (typeof raw === "string") return JSON.parse(raw);
  if (Array.isArray(raw)) return raw as UserToken[];
  return [];
}

/**
 * Authenticate user with email and password
 */
export async function login(
  email: string,
  password: string,
  ip: string,
  userAgent: string
): Promise<LoginResult> {
  const userRows = await db
    .select({ id: users.id, email: users.email, password: users.password })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!userRows.length || !userRows[0].password) {
    return { success: false, error: "Invalid email or password" };
  }

  const user = userRows[0];

  const valid = await verifyPassword(password, user.password!);
  if (!valid) {
    return { success: false, error: "Invalid email or password" };
  }

  const meta = await db
    .select({ metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
    .from(userMeta)
    .where(eq(userMeta.uid, user.id));

  const metaMap = buildMetaMap(meta);

  const twoFactorRequired =
    metaMap.two_factor_required === "true" || metaMap.two_factor_required === "1";

  if (twoFactorRequired) {
    const code = generateVerificationCode();
    const vToken = generateToken(50);

    const tokenObj: VerificationToken = {
      type: "verification",
      token: vToken,
      expire: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY.VERIFICATION,
      options: {
        code: encrypt(code),
        passed: false,
      },
    };

    await addUserToken(user.id, tokenObj);

    // Send 2FA code via email
    const firstName = metaMap.first_name || user.email;
    try {
      await emailService.sendTemplate({
        to: { email: user.email, name: firstName },
        template: "2fa-code",
        data: {
          code: code,
          userName: firstName,
          expiresInMinutes: 5,
        },
      });
    } catch (error) {
      console.error("Failed to send 2FA email:", error);
      // Don't fail login if email fails
    }

    return {
      success: true,
      requires2FA: true,
      verificationToken: vToken,
    };
  }

  return createSession(user.id, user.email, metaMap, ip, userAgent);
}

/**
 * Verify 2FA code and create session
 */
export async function verify2FA(
  verificationToken: string,
  code: string,
  ip: string,
  userAgent: string
): Promise<LoginResult> {
  const allUsers = await db
    .select({ id: users.id, email: users.email, tokens: users.tokens })
    .from(users);

  for (const user of allUsers) {
    const tokenList = parseTokens(user.tokens);

    const vToken = tokenList.find(
      (t) => t.type === "verification" && t.token === verificationToken
    ) as VerificationToken | undefined;

    if (vToken) {
      if (Date.now() / 1000 > vToken.expire) {
        await removeUserTokens(user.id, "verification", verificationToken);
        return { success: false, error: "Verification code expired" };
      }

      const { decrypt } = await import("@/lib/auth/crypto");
      const storedCode = decrypt(vToken.options.code);

      if (storedCode !== code) {
        return { success: false, error: "Invalid verification code" };
      }

      await removeUserTokens(user.id, "verification", verificationToken);

      const meta = await db
        .select({ metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
        .from(userMeta)
        .where(eq(userMeta.uid, user.id));

      const metaMap = buildMetaMap(meta);
      return createSession(user.id, user.email, metaMap, ip, userAgent);
    }
  }

  return { success: false, error: "Invalid verification token" };
}

async function createSession(
  userId: number,
  email: string,
  metaMap: Record<string, string | null>,
  ip: string,
  userAgent: string
): Promise<LoginResult> {
  const token = generateToken(100);

  const sessionToken: SessionToken = {
    type: "session",
    token,
    domain: "prodrones.com",
    expire: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY.SESSION,
    options: {
      ip,
      browser: { user_agent: userAgent },
      created: Math.floor(Date.now() / 1000),
    },
  };

  await addUserToken(userId, sessionToken);
  await setSessionCookie(token);

  const firstName = metaMap.first_name || "";
  const lastName = metaMap.last_name || "";

  const authUser: AuthUser = {
    id: userId,
    email,
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    roles: metaMap.roles ? JSON.parse(metaMap.roles) : [],
    permissions: metaMap.permissions ? JSON.parse(metaMap.permissions) : [],
    twoFactorRequired:
      metaMap.two_factor_required === "true" || metaMap.two_factor_required === "1",
  };

  return { success: true, user: authUser };
}

/**
 * Logout - remove session token and clear cookie
 */
export async function logout(userId: number, token: string): Promise<void> {
  await removeUserTokens(userId, "session", token);
  await clearSessionCookie();
}

interface RegisterResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

/**
 * Register new user and create session
 */
export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  ip: string,
  userAgent: string
): Promise<RegisterResult> {
  try {
    // Check if email already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: "Email already registered" };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user with empty tokens array
    const insertResult = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        tokens: JSON.stringify([]),
      })
      .$returningId();

    // Get the inserted user ID
    const userId = insertResult[0].id;

    // Insert user metadata
    await db.insert(userMeta).values([
      { uid: userId, metaKey: "first_name", metaValue: firstName },
      { uid: userId, metaKey: "last_name", metaValue: lastName },
      { uid: userId, metaKey: "roles", metaValue: JSON.stringify([ROLES.REGISTERED]) },
      { uid: userId, metaKey: "permissions", metaValue: JSON.stringify([]) },
    ]);

    // Create session and auto-login
    const metaMap = {
      first_name: firstName,
      last_name: lastName,
      roles: JSON.stringify([ROLES.REGISTERED]),
      permissions: JSON.stringify([]),
    };

    return createSession(userId, email, metaMap, ip, userAgent);
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Registration failed" };
  }
}

interface ForgotPasswordResult {
  success: boolean;
}

/**
 * Initiate password reset flow
 * Always returns success to prevent email enumeration
 */
export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  try {
    // Find user by email
    const userRows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // If user not found, still return success (prevent email enumeration)
    if (!userRows.length) {
      return { success: true };
    }

    const user = userRows[0];

    // Generate password reset token with 24-hour expiry
    const resetToken = generateToken(50);
    const tokenObj: PasswordResetToken = {
      type: "pass-reset",
      token: resetToken,
      expire: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY.PASS_RESET,
    };

    // Remove existing password reset tokens
    await removeUserTokens(user.id, "pass-reset");

    // Add new token
    await addUserToken(user.id, tokenObj);

    // Load user metadata for first name
    const meta = await db
      .select({ metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
      .from(userMeta)
      .where(eq(userMeta.uid, user.id));

    const metaMap = buildMetaMap(meta);
    const firstName = metaMap.first_name || user.email;

    // Send password reset email
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

    try {
      await emailService.sendTemplate({
        to: { email: user.email, name: firstName },
        template: "reset-password",
        data: {
          userName: firstName,
          resetLink,
          expiresInHours: 24,
        },
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      // Don't fail the request if email fails
    }

    return { success: true };
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return success to prevent information leakage
    return { success: true };
  }
}

interface ResetPasswordResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

/**
 * Reset password using reset token and create session
 */
export async function resetPassword(
  token: string,
  newPassword: string,
  ip: string,
  userAgent: string
): Promise<ResetPasswordResult> {
  try {
    // Find user with this password reset token
    const allUsers = await db
      .select({ id: users.id, email: users.email, tokens: users.tokens })
      .from(users);

    for (const user of allUsers) {
      const tokenList = parseTokens(user.tokens);

      const resetToken = tokenList.find(
        (t): t is PasswordResetToken =>
          t.type === "pass-reset" && t.token === token
      );

      if (resetToken) {
        // Check if token is expired
        if (Date.now() / 1000 > resetToken.expire) {
          await removeUserTokens(user.id, "pass-reset", token);
          return { success: false, error: "Invalid or expired token" };
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));

        // Remove all password reset tokens
        await removeUserTokens(user.id, "pass-reset");

        // Load user metadata for session creation
        const meta = await db
          .select({ metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
          .from(userMeta)
          .where(eq(userMeta.uid, user.id));

        const metaMap = buildMetaMap(meta);
        const firstName = metaMap.first_name || user.email;

        // Send password changed confirmation email
        try {
          await emailService.sendTemplate({
            to: { email: user.email, name: firstName },
            template: "password-changed",
            data: {
              userName: firstName,
              changedAt: new Date().toLocaleString(),
              ipAddress: ip,
            },
          });
        } catch (error) {
          console.error("Failed to send password changed email:", error);
          // Don't fail the request if email fails
        }

        // Create session (auto-login)
        return createSession(user.id, user.email, metaMap, ip, userAgent);
      }
    }

    return { success: false, error: "Invalid or expired token" };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, error: "Password reset failed" };
  }
}
