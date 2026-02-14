import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users, userMeta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "./crypto";
import { cache } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants";
import type { AuthUser, UserToken, SessionToken } from "@/modules/auth/types";

const SESSION_COOKIE = "pds_session";

/**
 * Get the current session token from cookies
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie?.value) return null;

  try {
    return decrypt(cookie.value);
  } catch {
    return null;
  }
}

/**
 * Set session cookie with encrypted token
 */
export async function setSessionCookie(token: string): Promise<void> {
  const encrypted = encrypt(token);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

function parseTokens(raw: unknown): UserToken[] {
  if (!raw) return [];
  if (typeof raw === "string") return JSON.parse(raw);
  if (Array.isArray(raw)) return raw as UserToken[];
  return [];
}

/**
 * Validate a session token against the Users.Tokens JSON array
 */
export async function validateSession(
  token: string
): Promise<AuthUser | null> {
  const cacheKey = `session:${token.substring(0, 20)}`;
  const cached = cache.get<AuthUser>(cacheKey);
  if (cached) return cached;

  // Find user with this token
  const allUsers = await db
    .select({ id: users.id, email: users.email, tokens: users.tokens })
    .from(users);

  for (const user of allUsers) {
    const tokenList = parseTokens(user.tokens);

    const sessionToken = tokenList.find(
      (t): t is SessionToken =>
        t.type === "session" && t.token === token
    );

    if (sessionToken) {
      // Check expiration
      if (sessionToken.expire && Date.now() / 1000 > sessionToken.expire) {
        const updatedTokens = tokenList.filter((t) => t !== sessionToken);
        await db
          .update(users)
          .set({ tokens: JSON.stringify(updatedTokens) })
          .where(eq(users.id, user.id));
        return null;
      }

      // Load user metadata
      const meta = await db
        .select()
        .from(userMeta)
        .where(eq(userMeta.uid, user.id));

      const metaMap: Record<string, string | null> = {};
      for (const m of meta) {
        metaMap[m.metaKey] = m.metaValue;
      }

      const firstName = metaMap.first_name || "";
      const lastName = metaMap.last_name || "";

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        fullName: [firstName, lastName].filter(Boolean).join(" "),
        roles: metaMap.roles ? JSON.parse(metaMap.roles) : [],
        permissions: metaMap.permissions ? JSON.parse(metaMap.permissions) : [],
        twoFactorRequired: metaMap.two_factor_required === "true" || metaMap.two_factor_required === "1",
      };

      cache.set(cacheKey, authUser, CACHE_TTL.USER_SESSIONS);
      return authUser;
    }
  }

  return null;
}

/**
 * Get current authenticated user from session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return validateSession(token);
}

/**
 * Add a token to user's Tokens JSON array
 */
export async function addUserToken(
  userId: number,
  newToken: UserToken
): Promise<void> {
  const user = await db
    .select({ tokens: users.tokens })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.length) return;

  const tokenList = parseTokens(user[0].tokens);
  tokenList.push(newToken);

  await db
    .update(users)
    .set({ tokens: JSON.stringify(tokenList) })
    .where(eq(users.id, userId));
}

/**
 * Remove tokens of a specific type for a user
 */
export async function removeUserTokens(
  userId: number,
  type: string,
  specificToken?: string
): Promise<void> {
  const user = await db
    .select({ tokens: users.tokens })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.length) return;

  const tokenList = parseTokens(user[0].tokens);

  const filtered = tokenList.filter((t) => {
    if (specificToken) {
      return !(t.type === type && t.token === specificToken);
    }
    return t.type !== type;
  });

  await db
    .update(users)
    .set({ tokens: JSON.stringify(filtered) })
    .where(eq(users.id, userId));
}
