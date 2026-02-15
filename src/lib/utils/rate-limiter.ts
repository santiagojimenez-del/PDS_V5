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

// Export singleton instance for forgot password
// 3 attempts per 15 minutes
export const forgotPasswordLimiter = new RateLimiter(3, 15);
