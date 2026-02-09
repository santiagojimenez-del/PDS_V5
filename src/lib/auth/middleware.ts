import { getCurrentUser } from "./session";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AuthUser } from "@/modules/auth/types";
import {
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api";

/**
 * Wrap an API route handler with authentication.
 * Returns 401 if no valid session exists; otherwise calls the handler
 * with the authenticated user.
 *
 * Usage: export const GET = withAuth(async (user, req) => { ... });
 */
export function withAuth(
  handler: (user: AuthUser, req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse("Authentication required");
    }
    return handler(user, request);
  };
}

/**
 * Wrap an API route handler with role-based access control.
 * Returns 401 if not authenticated, 403 if the user does not have
 * at least one of the required roles.
 *
 * Usage: export const GET = withRole([ROLES.ADMIN], async (user, req) => { ... });
 */
export function withRole(
  roles: number[],
  handler: (user: AuthUser, req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse("Authentication required");
    }
    const hasRole = user.roles.some((role) => roles.includes(role));
    if (!hasRole) {
      return forbiddenResponse("Insufficient role privileges");
    }
    return handler(user, request);
  };
}

/**
 * Wrap an API route handler with permission-based access control.
 * Returns 401 if not authenticated, 403 if the user does not have
 * the required permission.
 *
 * Usage: export const GET = withPermission("manage_job", async (user, req) => { ... });
 */
export function withPermission(
  permission: string,
  handler: (user: AuthUser, req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse("Authentication required");
    }
    // Admins bypass permission checks
    if (!user.roles.includes(0) && !user.permissions.includes(permission)) {
      return forbiddenResponse(`Missing required permission: ${permission}`);
    }
    return handler(user, request);
  };
}
