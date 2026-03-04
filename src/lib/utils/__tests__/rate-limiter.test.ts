import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RateLimiter, LoginAttemptTracker } from "../rate-limiter";

// ── RateLimiter ───────────────────────────────────────────────────────────────

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(3, 15); // 3 attempts per 15 minutes
  });

  it("allows the first attempt", () => {
    expect(limiter.check("user@example.com")).toBe(true);
  });

  it("allows up to maxAttempts within the window", () => {
    expect(limiter.check("user@example.com")).toBe(true); // 1
    expect(limiter.check("user@example.com")).toBe(true); // 2
    expect(limiter.check("user@example.com")).toBe(true); // 3
  });

  it("blocks when maxAttempts is exceeded", () => {
    limiter.check("user@example.com"); // 1
    limiter.check("user@example.com"); // 2
    limiter.check("user@example.com"); // 3
    expect(limiter.check("user@example.com")).toBe(false); // 4 - blocked
  });

  it("tracks different identifiers independently", () => {
    limiter.check("a@example.com"); // 1
    limiter.check("a@example.com"); // 2
    limiter.check("a@example.com"); // 3
    limiter.check("a@example.com"); // blocked

    // b has never been seen — should still be allowed
    expect(limiter.check("b@example.com")).toBe(true);
  });

  it("resets the window after it expires", () => {
    vi.useFakeTimers();

    limiter.check("user@example.com"); // 1
    limiter.check("user@example.com"); // 2
    limiter.check("user@example.com"); // 3
    expect(limiter.check("user@example.com")).toBe(false); // blocked

    // Advance time past the 15-minute window
    vi.advanceTimersByTime(16 * 60 * 1000);

    expect(limiter.check("user@example.com")).toBe(true); // window reset

    vi.useRealTimers();
  });

  it("getRemaining returns full count for unknown identifier", () => {
    expect(limiter.getRemaining("new@example.com")).toBe(3);
  });

  it("getRemaining decrements as attempts are made", () => {
    limiter.check("user@example.com"); // 1 used
    expect(limiter.getRemaining("user@example.com")).toBe(2);
    limiter.check("user@example.com"); // 2 used
    expect(limiter.getRemaining("user@example.com")).toBe(1);
  });

  it("getRemaining returns 0 when rate limited", () => {
    limiter.check("user@example.com");
    limiter.check("user@example.com");
    limiter.check("user@example.com");
    expect(limiter.getRemaining("user@example.com")).toBe(0);
  });

  it("getResetTime returns null for unknown identifier", () => {
    expect(limiter.getResetTime("unknown@example.com")).toBeNull();
  });

  it("getResetTime returns a positive number after first attempt", () => {
    limiter.check("user@example.com");
    const resetTime = limiter.getResetTime("user@example.com");
    expect(resetTime).not.toBeNull();
    expect(resetTime!).toBeGreaterThan(0);
  });

  it("reset() clears the entry so the identifier is allowed again", () => {
    limiter.check("user@example.com");
    limiter.check("user@example.com");
    limiter.check("user@example.com");
    expect(limiter.check("user@example.com")).toBe(false); // blocked

    limiter.reset("user@example.com");
    expect(limiter.check("user@example.com")).toBe(true); // allowed again
  });
});

// ── LoginAttemptTracker ───────────────────────────────────────────────────────

describe("LoginAttemptTracker", () => {
  let tracker: LoginAttemptTracker;

  beforeEach(() => {
    tracker = new LoginAttemptTracker(3, 60); // 3 attempts → 60 min lockout
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("isLocked returns false for unknown identifier", () => {
    const result = tracker.isLocked("user@example.com");
    expect(result.locked).toBe(false);
    expect(result.remainingMs).toBe(0);
  });

  it("isLocked returns false after single failed attempt", () => {
    tracker.recordFailure("user@example.com");
    expect(tracker.isLocked("user@example.com").locked).toBe(false);
  });

  it("recordFailure increments attempts and returns correct attemptsLeft", () => {
    const r1 = tracker.recordFailure("user@example.com");
    expect(r1.attempts).toBe(1);
    expect(r1.locked).toBe(false);
    expect(r1.attemptsLeft).toBe(2);

    const r2 = tracker.recordFailure("user@example.com");
    expect(r2.attempts).toBe(2);
    expect(r2.attemptsLeft).toBe(1);
  });

  it("recordFailure locks account after maxAttempts", () => {
    tracker.recordFailure("user@example.com"); // 1
    tracker.recordFailure("user@example.com"); // 2
    const r3 = tracker.recordFailure("user@example.com"); // 3 → lock

    expect(r3.locked).toBe(true);
    expect(r3.attemptsLeft).toBe(0);
    expect(r3.remainingMs).toBeGreaterThan(0);
  });

  it("isLocked returns locked=true immediately after lockout", () => {
    tracker.recordFailure("user@example.com");
    tracker.recordFailure("user@example.com");
    tracker.recordFailure("user@example.com");

    const status = tracker.isLocked("user@example.com");
    expect(status.locked).toBe(true);
    expect(status.remainingMs).toBeGreaterThan(59 * 60 * 1000); // ~60 min
  });

  it("recordFailure on locked account does not increment attempts further", () => {
    tracker.recordFailure("user@example.com"); // 1
    tracker.recordFailure("user@example.com"); // 2
    tracker.recordFailure("user@example.com"); // 3 → lock
    const r4 = tracker.recordFailure("user@example.com"); // still locked

    expect(r4.locked).toBe(true);
    expect(r4.attempts).toBe(3); // did not go to 4
  });

  it("isLocked clears entry and returns false after lockout expires", () => {
    vi.useFakeTimers();

    tracker.recordFailure("user@example.com");
    tracker.recordFailure("user@example.com");
    tracker.recordFailure("user@example.com"); // locked

    vi.advanceTimersByTime(61 * 60 * 1000); // past 60-min lockout

    const status = tracker.isLocked("user@example.com");
    expect(status.locked).toBe(false);
  });

  it("recordSuccess clears entry so user can log in freely", () => {
    tracker.recordFailure("user@example.com");
    tracker.recordFailure("user@example.com");
    tracker.recordSuccess("user@example.com");

    // After success the attempt count is gone
    expect(tracker.isLocked("user@example.com").locked).toBe(false);
    // Fresh attempts should start from 0
    const r = tracker.recordFailure("user@example.com");
    expect(r.attempts).toBe(1);
  });

  it("tracks different users independently", () => {
    tracker.recordFailure("attacker@example.com");
    tracker.recordFailure("attacker@example.com");
    tracker.recordFailure("attacker@example.com"); // attacker locked

    expect(tracker.isLocked("attacker@example.com").locked).toBe(true);
    expect(tracker.isLocked("innocent@example.com").locked).toBe(false);
  });
});
