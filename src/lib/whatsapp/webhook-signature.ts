import crypto from "crypto";

/**
 * Verifies that the incoming request payload matches the signature sent by Meta.
 * Uses the META_APP_SECRET environment variable.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  
  // If no secret is configured, skip verification in development
  if (!appSecret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("WARNING: META_APP_SECRET is not set. Skipping webhook signature verification.");
      return true;
    }
    return false;
  }

  if (!signatureHeader) {
    return false;
  }

  try {
    // Header format is: sha256=signatureHex
    const parts = signatureHeader.split("=");
    if (parts.length !== 2 || parts[0] !== "sha256") {
      return false;
    }
    
    const expectedSignature = parts[1];
    
    const hmac = crypto.createHmac("sha256", appSecret);
    hmac.update(rawBody, "utf8");
    const actualSignature = hmac.digest("hex");
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(actualSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}
