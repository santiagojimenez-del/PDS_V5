import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, logout, register, forgotPassword, resetPassword } from "../services/auth-service";

// ── Hoisted mocks (must be declared before vi.mock factories run) ──────────────

const dbSelectMock  = vi.hoisted(() => vi.fn());
const dbUpdateMock  = vi.hoisted(() => vi.fn());
const dbInsertMock  = vi.hoisted(() => vi.fn());

const mockVerifyPassword          = vi.hoisted(() => vi.fn<() => Promise<boolean>>());
const mockGenerateToken           = vi.hoisted(() => vi.fn<() => string>());
const mockGenerateVerificationCode = vi.hoisted(() => vi.fn<() => string>());
const mockEncrypt                 = vi.hoisted(() => vi.fn<(s: string) => string>());
const mockDecrypt                 = vi.hoisted(() => vi.fn<(s: string) => string>());
const mockHashPassword            = vi.hoisted(() => vi.fn<() => Promise<string>>());

const mockAddUserToken     = vi.hoisted(() => vi.fn());
const mockRemoveUserTokens = vi.hoisted(() => vi.fn());
const mockSetSessionCookie = vi.hoisted(() => vi.fn());
const mockClearSessionCookie = vi.hoisted(() => vi.fn());

const mockSendTemplate = vi.hoisted(() => vi.fn());

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: { select: dbSelectMock, update: dbUpdateMock, insert: dbInsertMock },
}));

vi.mock("@/lib/db/schema", () => ({
  users: {}, userMeta: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
  sql: vi.fn(() => ({})),
  desc: vi.fn((col: unknown) => col),
  and: vi.fn((...args: unknown[]) => args),
  gte: vi.fn(), lte: vi.fn(),
}));

vi.mock("@/lib/auth/crypto", () => ({
  verifyPassword:           mockVerifyPassword,
  generateToken:            mockGenerateToken,
  generateVerificationCode: mockGenerateVerificationCode,
  encrypt:                  mockEncrypt,
  hashPassword:             mockHashPassword,
  decrypt:                  mockDecrypt,
}));

vi.mock("@/lib/auth/session", () => ({
  addUserToken:       mockAddUserToken,
  removeUserTokens:   mockRemoveUserTokens,
  setSessionCookie:   mockSetSessionCookie,
  clearSessionCookie: mockClearSessionCookie,
}));

vi.mock("@/modules/email", () => ({
  emailService: { sendTemplate: mockSendTemplate },
}));

// ── Test helpers ──────────────────────────────────────────────────────────────

/**
 * Returns a chainable AND awaitable mock that resolves to `rows`.
 * Works for both .limit(1) and direct await-at-where patterns,
 * as well as db.update().set().where() and db.insert().values().$returningId().
 */
function makeQuery(rows: unknown[] = []) {
  const chain: Record<string, unknown> = {};
  for (const m of ["from", "where", "orderBy", "set", "values", "limit"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.$returningId = vi.fn().mockResolvedValue(rows);
  chain.then    = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(rows).then(res, rej);
  chain.catch   = (rej: (e: unknown) => unknown) => Promise.resolve(rows).catch(rej);
  chain.finally = (cb: () => void) => Promise.resolve(rows).finally(cb);
  return chain;
}

const USER = { id: 1, email: "user@test.com", password: "hashed_pw" };
const META_NO_2FA = [
  { metaKey: "first_name",  metaValue: "Alice" },
  { metaKey: "last_name",   metaValue: "Smith" },
  { metaKey: "roles",       metaValue: JSON.stringify([3]) },
  { metaKey: "permissions", metaValue: JSON.stringify([]) },
];
const EMPTY_TOKENS = [{ tokens: "[]" }];

/** Set up a standard successful-login sequence (no 2FA, no existing sessions) */
function setupSuccessfulLogin() {
  dbSelectMock
    .mockReturnValueOnce(makeQuery([USER]))        // 1. user lookup
    .mockReturnValueOnce(makeQuery(META_NO_2FA))   // 2. meta lookup
    .mockReturnValueOnce(makeQuery(EMPTY_TOKENS))  // 3. createSession: IP check
    .mockReturnValueOnce(makeQuery(EMPTY_TOKENS)); // 4. createSession: session limit
  mockVerifyPassword.mockResolvedValue(true);
  mockGenerateToken.mockReturnValue("tok_abc123");
  mockAddUserToken.mockResolvedValue(undefined);
  mockSetSessionCookie.mockResolvedValue(undefined);
  // Make sendTemplate chainable so the .catch() in createSession() doesn't throw
  mockSendTemplate.mockReturnValue({ catch: vi.fn() });
}

// ── login() ───────────────────────────────────────────────────────────────────

describe("login()", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns error when user is not found", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([])); // no user
    const result = await login("nobody@test.com", "pass", "1.2.3.4", "TestAgent");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password");
  });

  it("returns error when password is wrong", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([USER]));
    mockVerifyPassword.mockResolvedValue(false);
    const result = await login(USER.email, "wrong", "1.2.3.4", "TestAgent");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password");
  });

  it("creates a session and returns success when credentials are valid", async () => {
    setupSuccessfulLogin();
    const result = await login(USER.email, "correct", "1.2.3.4", "Chrome/Windows");
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe(USER.email);
    expect(result.user?.firstName).toBe("Alice");
    expect(result.requires2FA).toBeUndefined();
  });

  it("sets a session cookie after successful login", async () => {
    setupSuccessfulLogin();
    await login(USER.email, "correct", "1.2.3.4", "Chrome");
    expect(mockSetSessionCookie).toHaveBeenCalledWith("tok_abc123");
  });

  it("calls addUserToken with a session token after successful login", async () => {
    setupSuccessfulLogin();
    await login(USER.email, "correct", "1.2.3.4", "Chrome");
    expect(mockAddUserToken).toHaveBeenCalledWith(
      USER.id,
      expect.objectContaining({ type: "session", token: "tok_abc123" })
    );
  });

  it("returns requires2FA=true when two_factor_required meta is set", async () => {
    const metaWith2FA = [
      ...META_NO_2FA,
      { metaKey: "two_factor_required", metaValue: "true" },
    ];
    dbSelectMock
      .mockReturnValueOnce(makeQuery([USER]))
      .mockReturnValueOnce(makeQuery(metaWith2FA));
    mockVerifyPassword.mockResolvedValue(true);
    mockGenerateVerificationCode.mockReturnValue("123456");
    mockGenerateToken.mockReturnValue("vtoken_xyz");
    mockEncrypt.mockReturnValue("encrypted_code");
    mockAddUserToken.mockResolvedValue(undefined);
    mockSendTemplate.mockResolvedValue(undefined);

    const result = await login(USER.email, "correct", "1.2.3.4", "Chrome");
    expect(result.success).toBe(true);
    expect(result.requires2FA).toBe(true);
    expect(result.verificationToken).toBe("vtoken_xyz");
  });

  it("stores an encrypted 2FA code as a verification token", async () => {
    const metaWith2FA = [
      ...META_NO_2FA,
      { metaKey: "two_factor_required", metaValue: "true" },
    ];
    dbSelectMock
      .mockReturnValueOnce(makeQuery([USER]))
      .mockReturnValueOnce(makeQuery(metaWith2FA));
    mockVerifyPassword.mockResolvedValue(true);
    mockGenerateVerificationCode.mockReturnValue("654321");
    mockGenerateToken.mockReturnValue("vtoken");
    mockEncrypt.mockReturnValue("ENC_654321");
    mockAddUserToken.mockResolvedValue(undefined);
    mockSendTemplate.mockResolvedValue(undefined);

    await login(USER.email, "correct", "1.2.3.4", "Chrome");

    expect(mockAddUserToken).toHaveBeenCalledWith(
      USER.id,
      expect.objectContaining({
        type: "verification",
        options: expect.objectContaining({ code: "ENC_654321", passed: false }),
      })
    );
  });

  it("sends a 2FA code email when 2FA is required", async () => {
    const metaWith2FA = [
      ...META_NO_2FA,
      { metaKey: "two_factor_required", metaValue: "true" },
    ];
    dbSelectMock
      .mockReturnValueOnce(makeQuery([USER]))
      .mockReturnValueOnce(makeQuery(metaWith2FA));
    mockVerifyPassword.mockResolvedValue(true);
    mockGenerateVerificationCode.mockReturnValue("111111");
    mockGenerateToken.mockReturnValue("vtoken");
    mockEncrypt.mockReturnValue("enc");
    mockAddUserToken.mockResolvedValue(undefined);
    mockSendTemplate.mockResolvedValue(undefined);

    await login(USER.email, "correct", "1.2.3.4", "Chrome");

    expect(mockSendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "2fa-code",
        data: expect.objectContaining({ code: "111111" }),
      })
    );
  });

  it("sends a new-login notification for an unrecognised IP", async () => {
    setupSuccessfulLogin();
    mockSendTemplate.mockReturnValue({ catch: vi.fn() });
    await login(USER.email, "correct", "9.9.9.9", "Chrome");
    expect(mockSendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ template: "new-login" })
    );
  });

  it("does NOT send a new-login notification when IP is 'unknown'", async () => {
    setupSuccessfulLogin();
    await login(USER.email, "correct", "unknown", "Chrome");
    const newLoginCalls = (mockSendTemplate.mock.calls as unknown[][]).filter(
      (args) =>
        typeof args[0] === "object" &&
        args[0] !== null &&
        (args[0] as Record<string, unknown>).template === "new-login"
    );
    expect(newLoginCalls).toHaveLength(0);
  });
});

// ── logout() ──────────────────────────────────────────────────────────────────

describe("logout()", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("removes the session token and clears the cookie", async () => {
    mockRemoveUserTokens.mockResolvedValue(undefined);
    mockClearSessionCookie.mockResolvedValue(undefined);

    await logout(1, "some_token");

    expect(mockRemoveUserTokens).toHaveBeenCalledWith(1, "session", "some_token");
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });
});

// ── register() ────────────────────────────────────────────────────────────────

describe("register()", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns error when email is already registered", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([{ id: 99 }])); // email exists
    const result = await register("taken@test.com", "pass", "Bob", "Jones", "1.2.3.4", "Chrome");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Email already registered");
  });

  it("creates user and returns success for a new email", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeQuery([]))              // email not taken
      .mockReturnValueOnce(makeQuery(EMPTY_TOKENS))    // createSession: IP check
      .mockReturnValueOnce(makeQuery(EMPTY_TOKENS));   // createSession: session limit
    mockHashPassword.mockResolvedValue("hashed_new");
    dbInsertMock
      .mockReturnValueOnce(makeQuery([{ id: 42 }]))    // insert user → $returningId
      .mockReturnValueOnce(makeQuery([]));             // insert userMeta
    mockGenerateToken.mockReturnValue("new_session_tok");
    mockAddUserToken.mockResolvedValue(undefined);
    mockSetSessionCookie.mockResolvedValue(undefined);

    const result = await register("new@test.com", "pass", "Bob", "Jones", "1.2.3.4", "Chrome");
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe("new@test.com");
    expect(result.user?.firstName).toBe("Bob");
  });

  it("hashes the password before storing it", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeQuery([]))
      .mockReturnValueOnce(makeQuery(EMPTY_TOKENS))
      .mockReturnValueOnce(makeQuery(EMPTY_TOKENS));
    mockHashPassword.mockResolvedValue("super_hashed");
    dbInsertMock
      .mockReturnValueOnce(makeQuery([{ id: 7 }]))
      .mockReturnValueOnce(makeQuery([]));
    mockGenerateToken.mockReturnValue("tok");
    mockAddUserToken.mockResolvedValue(undefined);
    mockSetSessionCookie.mockResolvedValue(undefined);

    await register("x@test.com", "plaintext", "A", "B", "1.2.3.4", "Chrome");
    expect(mockHashPassword).toHaveBeenCalledWith("plaintext");
  });
});

// ── forgotPassword() ──────────────────────────────────────────────────────────

describe("forgotPassword()", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns success even when the email is not registered (anti-enumeration)", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([])); // user not found
    const result = await forgotPassword("ghost@test.com");
    expect(result.success).toBe(true);
    expect(mockSendTemplate).not.toHaveBeenCalled();
  });

  it("generates a reset token and sends an email when the user exists", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeQuery([USER]))       // user found
      .mockReturnValueOnce(makeQuery(META_NO_2FA)); // meta lookup
    mockRemoveUserTokens.mockResolvedValue(undefined);
    mockAddUserToken.mockResolvedValue(undefined);
    mockGenerateToken.mockReturnValue("reset_tok_abc");
    mockSendTemplate.mockResolvedValue(undefined);

    const result = await forgotPassword(USER.email);
    expect(result.success).toBe(true);
    expect(mockSendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "reset-password",
        data: expect.objectContaining({ resetLink: expect.stringContaining("reset_tok_abc") }),
      })
    );
  });

  it("stores the reset token so it can be validated later", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeQuery([USER]))
      .mockReturnValueOnce(makeQuery(META_NO_2FA));
    mockRemoveUserTokens.mockResolvedValue(undefined);
    mockAddUserToken.mockResolvedValue(undefined);
    mockGenerateToken.mockReturnValue("reset_tok_xyz");
    mockSendTemplate.mockResolvedValue(undefined);

    await forgotPassword(USER.email);
    expect(mockAddUserToken).toHaveBeenCalledWith(
      USER.id,
      expect.objectContaining({ type: "pass-reset", token: "reset_tok_xyz" })
    );
  });
});

// ── resetPassword() ───────────────────────────────────────────────────────────

describe("resetPassword()", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const VALID_RESET_TOKEN = {
    type: "pass-reset",
    token: "valid_reset_tok",
    expire: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  const EXPIRED_RESET_TOKEN = {
    type: "pass-reset",
    token: "expired_reset_tok",
    expire: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  };

  it("returns error when no user has the given reset token", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([])); // no users
    const result = await resetPassword("fake_token", "newpass", "1.2.3.4", "Chrome");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid or expired token");
  });

  it("returns error when the reset token is expired", async () => {
    dbSelectMock.mockReturnValueOnce(
      makeQuery([{ id: 1, email: USER.email, tokens: JSON.stringify([EXPIRED_RESET_TOKEN]) }])
    );
    const result = await resetPassword("expired_reset_tok", "newpass", "1.2.3.4", "Chrome");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid or expired token");
  });

  it("updates password and creates a session on a valid token", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        makeQuery([{ id: 1, email: USER.email, tokens: JSON.stringify([VALID_RESET_TOKEN]) }])
      )
      .mockReturnValueOnce(makeQuery(META_NO_2FA))   // meta for session creation
      .mockReturnValueOnce(makeQuery(EMPTY_TOKENS))  // createSession: IP check
      .mockReturnValueOnce(makeQuery(EMPTY_TOKENS)); // createSession: session limit

    dbUpdateMock.mockReturnValueOnce(makeQuery([]));  // update password
    mockRemoveUserTokens.mockResolvedValue(undefined);
    mockHashPassword.mockResolvedValue("hashed_new_pw");
    mockGenerateToken.mockReturnValue("new_session_tok");
    mockAddUserToken.mockResolvedValue(undefined);
    mockSetSessionCookie.mockResolvedValue(undefined);
    mockSendTemplate.mockResolvedValue(undefined);

    const result = await resetPassword("valid_reset_tok", "newpass", "1.2.3.4", "Chrome");
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe(USER.email);
    expect(mockHashPassword).toHaveBeenCalledWith("newpass");
  });

  it("removes all reset tokens after a successful password change", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        makeQuery([{ id: 1, email: USER.email, tokens: JSON.stringify([VALID_RESET_TOKEN]) }])
      )
      .mockReturnValueOnce(makeQuery(META_NO_2FA))
      .mockReturnValueOnce(makeQuery(EMPTY_TOKENS))
      .mockReturnValueOnce(makeQuery(EMPTY_TOKENS));

    dbUpdateMock.mockReturnValueOnce(makeQuery([]));
    mockRemoveUserTokens.mockResolvedValue(undefined);
    mockHashPassword.mockResolvedValue("hashed");
    mockGenerateToken.mockReturnValue("tok");
    mockAddUserToken.mockResolvedValue(undefined);
    mockSetSessionCookie.mockResolvedValue(undefined);
    mockSendTemplate.mockResolvedValue(undefined);

    await resetPassword("valid_reset_tok", "newpass", "1.2.3.4", "Chrome");
    expect(mockRemoveUserTokens).toHaveBeenCalledWith(1, "pass-reset");
  });

  it("sends a password-changed confirmation email after reset", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        makeQuery([{ id: 1, email: USER.email, tokens: JSON.stringify([VALID_RESET_TOKEN]) }])
      )
      .mockReturnValueOnce(makeQuery(META_NO_2FA))
      .mockReturnValueOnce(makeQuery(EMPTY_TOKENS))
      .mockReturnValueOnce(makeQuery(EMPTY_TOKENS));

    dbUpdateMock.mockReturnValueOnce(makeQuery([]));
    mockRemoveUserTokens.mockResolvedValue(undefined);
    mockHashPassword.mockResolvedValue("hashed");
    mockGenerateToken.mockReturnValue("tok");
    mockAddUserToken.mockResolvedValue(undefined);
    mockSetSessionCookie.mockResolvedValue(undefined);
    mockSendTemplate.mockResolvedValue(undefined);

    await resetPassword("valid_reset_tok", "newpass", "1.2.3.4", "Chrome");
    expect(mockSendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ template: "password-changed" })
    );
  });
});
