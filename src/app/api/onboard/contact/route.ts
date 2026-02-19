import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, userMeta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { hashPassword, generateToken } from "@/lib/auth/crypto";
import { setMetaValue } from "@/lib/db/helpers";
import { addOrgContact } from "@/modules/organizations/services/organization-service";
import { emailService } from "@/modules/email";
import { ROLES } from "@/lib/constants";

/**
 * POST /api/onboard/contact
 *
 * Creates a new contact (Client role) and optionally links them to an
 * organization. Sends a welcome email with a link to set their password.
 *
 * Body: { email, firstName, lastName?, phone?, orgId? }
 */
export const POST = withAuth(async (_user, req: NextRequest) => {
  const body = await req.json();
  const { email, firstName, lastName, phone, orgId } = body;

  if (!email?.trim()) return errorResponse("Email is required", 400);
  if (!firstName?.trim()) return errorResponse("First name is required", 400);

  const normalizedEmail = email.trim().toLowerCase();

  // Check uniqueness
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail));
  if (existing) return errorResponse("Email already registered", 409);

  // Create user with a random password (contact must use reset-password to log in)
  const tempPassword = generateToken(24);
  const hashed = await hashPassword(tempPassword);

  const result = await db.insert(users).values({
    email: normalizedEmail,
    password: hashed,
    tokens: JSON.stringify([]),
  }).$returningId();

  const userId = result[0].id;

  // Set metadata
  await setMetaValue(db, userMeta, userMeta.uid, userId, "first_name", firstName.trim());
  if (lastName?.trim()) await setMetaValue(db, userMeta, userMeta.uid, userId, "last_name", lastName.trim());
  if (phone?.trim())    await setMetaValue(db, userMeta, userMeta.uid, userId, "phone_number", phone.trim());
  await setMetaValue(db, userMeta, userMeta.uid, userId, "roles", JSON.stringify([ROLES.CLIENT]));

  // Link to organization if provided
  if (orgId) {
    try {
      await addOrgContact(orgId, userId);
    } catch (err) {
      console.warn("[onboard/contact] Could not link org:", err);
      // Non-fatal — user created, org link failed
    }
  }

  // Send welcome email with a reset-password link so they can set their own password
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";
  const loginLink = `${baseUrl}/forgot-password`;
  const userName = [firstName.trim(), lastName?.trim()].filter(Boolean).join(" ");

  await emailService.sendTemplate({
    to: { email: normalizedEmail, name: userName },
    template: "signup-confirmation",
    data: {
      userName,
      confirmationLink: loginLink,
    },
  });

  return successResponse({ id: userId, email: normalizedEmail, message: "Contact created" }, 201);
});
