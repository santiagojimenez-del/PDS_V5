import crypto from "crypto";
import bcrypt from "bcryptjs";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const BCRYPT_COST = 11;

function getAesKey(): Buffer {
  const key = process.env.AES_KEY;
  if (!key || key.length !== 32) {
    throw new Error("AES_KEY must be exactly 32 characters");
  }
  return Buffer.from(key, "utf-8");
}

/**
 * Encrypt a string using AES-256-CBC
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getAesKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt an AES-256-CBC encrypted string
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 2) throw new Error("Invalid encrypted text format");
  const iv = Buffer.from(parts[0], "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getAesKey(), iv);
  let decrypted = decipher.update(parts[1], "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Hash a password using bcrypt with cost 11 (matching PHP implementation)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random token string of specified length
 */
export function generateToken(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate a token with random split point (matching existing format)
 * The split point divides the token into two parts for storage
 */
export function generateSplitToken(
  length: number,
  minSplit: number,
  maxSplit: number
): { token: string; split: number } {
  const token = generateToken(length);
  const split =
    minSplit + Math.floor(Math.random() * (maxSplit - minSplit + 1));
  return { token, split };
}

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}
