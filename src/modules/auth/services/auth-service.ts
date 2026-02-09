import { db } from "@/lib/db";
import { users, userMeta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, generateToken, generateVerificationCode, encrypt } from "@/lib/auth/crypto";
import {
  addUserToken,
  removeUserTokens,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth/session";
import { TOKEN_EXPIRY } from "@/lib/constants";
import type { AuthUser, SessionToken, VerificationToken, UserToken } from "../types";

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
