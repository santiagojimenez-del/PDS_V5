/**
 * Socket.IO session authentication.
 * Reads the pds_session cookie from the socket handshake headers,
 * decrypts it, and validates the token against the Users.Tokens JSON array.
 * Cannot use Next.js cookies() API here — operates in plain Node.js context.
 */

import { db } from "@/lib/db";
import { users, userMeta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth/crypto";

export interface SocketUser {
  id: number;
  email: string;
  token: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: number[];
}

type RawToken = { type: string; token?: string; expire?: number };

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

function parseTokens(raw: unknown): RawToken[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw as RawToken[];
  return [];
}

export async function authenticateSocket(
  cookieHeader: string | undefined
): Promise<SocketUser | null> {
  if (!cookieHeader) return null;

  const cookies = parseCookieHeader(cookieHeader);
  const encryptedToken = cookies["pds_session"];
  if (!encryptedToken) return null;

  let token: string;
  try {
    token = decrypt(decodeURIComponent(encryptedToken));
  } catch {
    return null;
  }

  // Scan all users for a matching session token
  // (same approach as validateSession in session.ts)
  const allUsers = await db
    .select({ id: users.id, email: users.email, tokens: users.tokens })
    .from(users);

  for (const user of allUsers) {
    const tokenList = parseTokens(user.tokens);

    const sessionToken = tokenList.find(
      (t) => t.type === "session" && t.token === token
    );

    if (sessionToken) {
      // Check expiration
      if (
        sessionToken.expire &&
        Date.now() / 1000 > sessionToken.expire
      ) {
        return null;
      }

      // Load user metadata
      const meta = await db
        .select({ metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
        .from(userMeta)
        .where(eq(userMeta.uid, user.id));

      const metaMap: Record<string, string | null> = {};
      for (const m of meta) metaMap[m.metaKey] = m.metaValue;

      const firstName = metaMap.first_name || "";
      const lastName = metaMap.last_name || "";

      return {
        id: user.id,
        email: user.email,
        token,
        firstName,
        lastName,
        fullName: [firstName, lastName].filter(Boolean).join(" "),
        roles: metaMap.roles ? JSON.parse(metaMap.roles) : [],
      };
    }
  }

  return null;
}
