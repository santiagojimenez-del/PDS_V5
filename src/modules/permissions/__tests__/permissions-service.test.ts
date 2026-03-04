import { describe, it, expect, vi } from "vitest";
import { hasPermission, hasRole } from "../services/permissions-service";
import type { AuthUser } from "@/modules/auth/types";

// ── Mocks for DB-dependent imports ───────────────────────────────────────────
// Only needed so the module can be imported — hasPermission/hasRole are pure.

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({ permissions: {}, pages: {} }));
vi.mock("@/lib/cache", () => ({ cache: { get: vi.fn(), set: vi.fn() } }));
vi.mock("@/lib/constants", () => ({ CACHE_TTL: { PERMISSIONS: 600_000 } }));
vi.mock("@/modules/config/services/config-loader", () => ({
  getConfigValue: vi.fn(),
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(), and: vi.fn(), isNull: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    email: "user@test.com",
    firstName: "Test",
    lastName: "User",
    fullName: "Test User",
    roles: [3], // REGISTERED by default
    permissions: [],
    twoFactorRequired: false,
    ...overrides,
  };
}

// ── hasPermission() ───────────────────────────────────────────────────────────

describe("hasPermission()", () => {
  it("returns true for an admin (role 0) regardless of their permissions list", () => {
    const admin = makeUser({ roles: [0], permissions: [] });
    expect(hasPermission(admin, "can_do_anything")).toBe(true);
  });

  it("admin bypass works even when permission does not exist at all", () => {
    const admin = makeUser({ roles: [0] });
    expect(hasPermission(admin, "nonexistent.permission")).toBe(true);
  });

  it("returns true when non-admin user has the specific permission", () => {
    const user = makeUser({ roles: [5], permissions: ["view_reports", "export_data"] });
    expect(hasPermission(user, "view_reports")).toBe(true);
  });

  it("returns false when non-admin user is missing the permission", () => {
    const user = makeUser({ roles: [5], permissions: ["view_reports"] });
    expect(hasPermission(user, "delete_jobs")).toBe(false);
  });

  it("returns false when the permissions list is empty", () => {
    const user = makeUser({ roles: [3], permissions: [] });
    expect(hasPermission(user, "any.permission")).toBe(false);
  });

  it("comparison is case-sensitive (exact match required)", () => {
    const user = makeUser({ permissions: ["view_Reports"] });
    expect(hasPermission(user, "view_reports")).toBe(false);
    expect(hasPermission(user, "view_Reports")).toBe(true);
  });

  it("a user with admin role alongside other roles still gets the bypass", () => {
    const user = makeUser({ roles: [0, 3], permissions: [] });
    expect(hasPermission(user, "some.permission")).toBe(true);
  });

  it("a user who is NOT admin must have the exact permission string", () => {
    const user = makeUser({ roles: [1], permissions: ["jobs.read", "jobs.write"] });
    expect(hasPermission(user, "jobs.read")).toBe(true);
    expect(hasPermission(user, "jobs.delete")).toBe(false);
  });
});

// ── hasRole() ─────────────────────────────────────────────────────────────────

describe("hasRole()", () => {
  it("returns true when user has one of the specified roles", () => {
    const user = makeUser({ roles: [3, 5] });
    expect(hasRole(user, [5, 6])).toBe(true);
  });

  it("returns true when user has the exact role in a single-element array", () => {
    const user = makeUser({ roles: [7] });
    expect(hasRole(user, [7])).toBe(true);
  });

  it("returns false when user has none of the specified roles", () => {
    const user = makeUser({ roles: [3] });
    expect(hasRole(user, [0, 1, 5, 6, 7])).toBe(false);
  });

  it("returns false when the allowed roles array is empty", () => {
    const user = makeUser({ roles: [3] });
    expect(hasRole(user, [])).toBe(false);
  });

  it("returns false when user has no roles", () => {
    const user = makeUser({ roles: [] });
    expect(hasRole(user, [1, 3, 5])).toBe(false);
  });

  it("returns false when both arrays are empty", () => {
    const user = makeUser({ roles: [] });
    expect(hasRole(user, [])).toBe(false);
  });

  it("matches any role in the user's role list (OR logic)", () => {
    const user = makeUser({ roles: [1, 3, 6] }); // client + registered + pilot
    expect(hasRole(user, [6])).toBe(true);  // pilot match
    expect(hasRole(user, [0])).toBe(false); // not admin
  });

  it("admin role (0) is not special in hasRole — only role membership matters", () => {
    const admin = makeUser({ roles: [0] });
    expect(hasRole(admin, [0])).toBe(true);  // only if 0 is in the allowed list
    expect(hasRole(admin, [1, 3])).toBe(false); // 0 not in [1, 3]
  });
});
