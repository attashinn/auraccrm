import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.DATABASE_URL || process.env.CLERK_SECRET_KEY || "fallback-temporary-development-key-32chars!";
  // Derive a 32-byte key from the secret using SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a string token using AES-256-GCM
 */
export function encryptToken(text: string): string {
  if (!text) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Format: iv:authTag:encryptedText
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string token using AES-256-GCM
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText) return "";
  
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      // Fallback: if it's not encrypted (e.g., legacy or dev mode), return as is
      return encryptedText;
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt token:", error);
    // If decryption fails, return the original string in case it wasn't encrypted
    return encryptedText;
  }
}
