/**
 * Simple in-memory rate limiter
 * Tracks attempts per identifier (e.g., email) with automatic cleanup
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 3, windowMinutes: number = 15) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  /**
   * Check if identifier is within rate limit
   * Returns true if allowed, false if rate limited
   */
  check(identifier: string): boolean {
    this.cleanup();

    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry) {
      // First attempt - allow and track
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // Check if window has expired
    if (now > entry.resetTime) {
      // Reset window
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // Within window - check count
    if (entry.count >= this.maxAttempts) {
      return false; // Rate limited
    }

    // Increment count
    entry.count++;
    this.attempts.set(identifier, entry);
    return true;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      if (now > entry.resetTime) {
        this.attempts.delete(key);
      }
    }
  }

  /**
   * Get remaining attempts for identifier
   */
  getRemaining(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - entry.count);
  }

  /**
   * Get time until reset in milliseconds
   */
  getResetTime(identifier: string): number | null {
    const entry = this.attempts.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }
    return entry.resetTime - Date.now();
  }

  /**
   * Manually reset attempts for identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// ── Singleton instances ────────────────────────────────────────────────────────

// Forgot password: 3 requests per 15 minutes per email
export const forgotPasswordLimiter = new RateLimiter(3, 15);

// Register: 10 new accounts per IP per hour (blocks bot signups)
export const registerLimiter = new RateLimiter(10, 60);

// Reset password token submission: 5 per IP per 15 minutes (blocks token brute-force)
export const resetPasswordLimiter = new RateLimiter(5, 15);

// Share token validation: 30 per IP per 5 minutes (blocks token enumeration on public endpoint)
export const shareValidateLimiter = new RateLimiter(30, 5);

// Global search: 60 queries per user per minute (prevents authenticated data harvesting)
export const searchLimiter = new RateLimiter(60, 1);

// ---------------------------------------------------------------------------
// LoginAttemptTracker
// Tracks failed login attempts per email and enforces account lockout.
// Default: 3 failed attempts → 60 minute lockout.
// ---------------------------------------------------------------------------

interface LockoutEntry {
  failedAttempts: number;
  lockedUntil: number | null; // ms timestamp, null = not locked
  lastAttempt: number;
}

export class LoginAttemptTracker {
  private entries: Map<string, LockoutEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly lockoutMs: number;

  constructor(maxAttempts: number = 3, lockoutMinutes: number = 60) {
    this.maxAttempts = maxAttempts;
    this.lockoutMs = lockoutMinutes * 60 * 1000;
  }

  /**
   * Check if the identifier (email) is currently locked out.
   */
  isLocked(identifier: string): { locked: boolean; remainingMs: number } {
    const entry = this.entries.get(identifier);
    if (!entry || !entry.lockedUntil) {
      return { locked: false, remainingMs: 0 };
    }
    const now = Date.now();
    if (now >= entry.lockedUntil) {
      this.entries.delete(identifier);
      return { locked: false, remainingMs: 0 };
    }
    return { locked: true, remainingMs: entry.lockedUntil - now };
  }

  /**
   * Record a failed login attempt. Returns new status after recording.
   */
  recordFailure(identifier: string): {
    attempts: number;
    locked: boolean;
    remainingMs: number;
    attemptsLeft: number;
  } {
    const now = Date.now();
    const entry: LockoutEntry = this.entries.get(identifier) ?? {
      failedAttempts: 0,
      lockedUntil: null,
      lastAttempt: now,
    };

    // If still within a lockout window, do not increment further
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return {
        attempts: entry.failedAttempts,
        locked: true,
        remainingMs: entry.lockedUntil - now,
        attemptsLeft: 0,
      };
    }

    // Lockout expired — reset counter
    if (entry.lockedUntil && now >= entry.lockedUntil) {
      entry.failedAttempts = 0;
      entry.lockedUntil = null;
    }

    entry.failedAttempts += 1;
    entry.lastAttempt = now;

    if (entry.failedAttempts >= this.maxAttempts) {
      entry.lockedUntil = now + this.lockoutMs;
      this.entries.set(identifier, entry);
      return {
        attempts: entry.failedAttempts,
        locked: true,
        remainingMs: this.lockoutMs,
        attemptsLeft: 0,
      };
    }

    this.entries.set(identifier, entry);
    return {
      attempts: entry.failedAttempts,
      locked: false,
      remainingMs: 0,
      attemptsLeft: this.maxAttempts - entry.failedAttempts,
    };
  }

  /**
   * Clear attempts after a successful login.
   */
  recordSuccess(identifier: string): void {
    this.entries.delete(identifier);
  }
}

// Singleton: 3 max attempts, 60 minute lockout
export const loginAttemptTracker = new LoginAttemptTracker(3, 60);

// 2FA code verification: 5 attempts per verification token within its 5-min lifetime
export const twoFactorLimiter = new RateLimiter(5, 10);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract the client IP from a Next.js request.
 * Falls back to "unknown" when running behind a proxy without x-forwarded-for.
 */
export function getClientIp(
  headers: Headers | { get: (name: string) => string | null }
): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
