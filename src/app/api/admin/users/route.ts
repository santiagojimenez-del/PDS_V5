import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, userMeta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { ROLES } from "@/lib/constants";
import { hashPassword } from "@/lib/auth/crypto";
import { setMetaValue } from "@/lib/db/helpers";

export const GET = withRole([ROLES.ADMIN], async (_user, req: NextRequest) => {
  const userRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .orderBy(users.id);

  // Get meta for all users
  const metaRows = await db
    .select({
      uid: userMeta.uid,
      metaKey: userMeta.metaKey,
      metaValue: userMeta.metaValue,
    })
    .from(userMeta);

  const metaByUser: Record<number, Record<string, string | null>> = {};
  for (const m of metaRows) {
    if (!metaByUser[m.uid]) metaByUser[m.uid] = {};
    metaByUser[m.uid][m.metaKey] = m.metaValue;
  }

  const enriched = userRows.map((u) => {
    const meta = metaByUser[u.id] || {};
    let roles: number[] = [];
    try {
      roles = JSON.parse(meta.roles || "[]");
    } catch { /* ignore */ }

    return {
      id: u.id,
      email: u.email,
      firstName: meta.first_name || "",
      lastName: meta.last_name || "",
      fullName: [meta.first_name, meta.last_name].filter(Boolean).join(" "),
      roles,
      phoneNumber: meta.phone_number || null,
      twoFactorEnabled: meta.two_factor_required === "true" || meta.two_factor_required === "1",
    };
  });

  return successResponse({ users: enriched, total: enriched.length });
});

// ── POST /api/admin/users — create new user ───────────────────────────────────
export const POST = withRole([ROLES.ADMIN], async (_admin, req: NextRequest) => {
  const body = await req.json();
  const { email, password, firstName, lastName, phoneNumber, roles } = body;

  if (!email || !password) return errorResponse("Email and password are required", 400);
  if (password.length < 8) return errorResponse("Password must be at least 8 characters", 400);

  // Check email uniqueness
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase().trim()));
  if (existing) return errorResponse("Email already in use", 409);

  const hashed = await hashPassword(password);
  const result = await db.insert(users).values({
    email: email.toLowerCase().trim(),
    password: hashed,
    tokens: JSON.stringify([]),
  }).$returningId();

  const userId = result[0].id;

  if (firstName) await setMetaValue(db, userMeta, userMeta.uid, userId, "first_name", firstName);
  if (lastName)  await setMetaValue(db, userMeta, userMeta.uid, userId, "last_name", lastName);
  if (phoneNumber) await setMetaValue(db, userMeta, userMeta.uid, userId, "phone_number", phoneNumber);

  const userRoles = Array.isArray(roles) && roles.length ? roles : [ROLES.REGISTERED];
  await setMetaValue(db, userMeta, userMeta.uid, userId, "roles", JSON.stringify(userRoles));

  return successResponse({ id: userId, email, message: "User created" }, 201);
});
