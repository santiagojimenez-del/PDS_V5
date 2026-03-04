import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateToken,
  generateVerificationCode,
  generateSplitToken,
} from "../crypto";

// AES_KEY is set to "test-aes-key-exactly-32-chars!!" in vitest.config.ts

// ── encrypt / decrypt ─────────────────────────────────────────────────────────

describe("encrypt / decrypt", () => {
  it("decrypts back to the original plaintext", () => {
    const original = "hello world";
    expect(decrypt(encrypt(original))).toBe(original);
  });

  it("produces a string containing a colon separator (iv:ciphertext)", () => {
    const result = encrypt("test");
    expect(result).toContain(":");
    const parts = result.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveLength(32); // 16-byte IV in hex = 32 chars
  });

  it("produces different ciphertexts for the same input (random IV)", () => {
    const c1 = encrypt("same input");
    const c2 = encrypt("same input");
    expect(c1).not.toBe(c2);
  });

  it("handles empty string", () => {
    expect(decrypt(encrypt(""))).toBe("");
  });

  it("handles unicode characters", () => {
    const text = "contraseña 🔑";
    expect(decrypt(encrypt(text))).toBe(text);
  });

  it("throws on malformed encrypted string (no colon)", () => {
    expect(() => decrypt("no-colon-here")).toThrow();
  });
});

// ── hashPassword / verifyPassword ─────────────────────────────────────────────

describe("hashPassword / verifyPassword", { timeout: 15_000 }, () => {
  it("returns a bcrypt hash string (starts with $2)", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("hash is different from the plaintext password", async () => {
    const hash = await hashPassword("mypassword");
    expect(hash).not.toBe("mypassword");
  });

  it("verifyPassword returns true for the correct password", async () => {
    const hash = await hashPassword("correct-password");
    expect(await verifyPassword("correct-password", hash)).toBe(true);
  });

  it("verifyPassword returns false for a wrong password", async () => {
    const hash = await hashPassword("correct-password");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("two hashes of the same password are different (bcrypt salting)", async () => {
    const h1 = await hashPassword("same");
    const h2 = await hashPassword("same");
    expect(h1).not.toBe(h2);
    // But both should verify correctly
    expect(await verifyPassword("same", h1)).toBe(true);
    expect(await verifyPassword("same", h2)).toBe(true);
  });
}); // timeout set on describe block above

// ── generateToken ─────────────────────────────────────────────────────────────

describe("generateToken", () => {
  it("returns a string of the requested length", () => {
    expect(generateToken(50)).toHaveLength(50);
    expect(generateToken(100)).toHaveLength(100);
  });

  it("contains only alphanumeric characters", () => {
    const token = generateToken(200);
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("two calls produce different tokens", () => {
    expect(generateToken(50)).not.toBe(generateToken(50));
  });
});

// ── generateVerificationCode ──────────────────────────────────────────────────

describe("generateVerificationCode", () => {
  it("returns a 6-character string", () => {
    expect(generateVerificationCode()).toHaveLength(6);
  });

  it("contains only digits", () => {
    for (let i = 0; i < 10; i++) {
      expect(generateVerificationCode()).toMatch(/^\d{6}$/);
    }
  });

  it("falls within the valid 6-digit range", () => {
    for (let i = 0; i < 10; i++) {
      const code = parseInt(generateVerificationCode(), 10);
      expect(code).toBeGreaterThanOrEqual(100000);
      expect(code).toBeLessThanOrEqual(999999);
    }
  });
});

// ── generateSplitToken ────────────────────────────────────────────────────────

describe("generateSplitToken", () => {
  it("returns a token of the requested length", () => {
    const { token } = generateSplitToken(60, 10, 30);
    expect(token).toHaveLength(60);
  });

  it("returns a split value within [minSplit, maxSplit]", () => {
    for (let i = 0; i < 20; i++) {
      const { split } = generateSplitToken(60, 10, 30);
      expect(split).toBeGreaterThanOrEqual(10);
      expect(split).toBeLessThanOrEqual(30);
    }
  });
});
