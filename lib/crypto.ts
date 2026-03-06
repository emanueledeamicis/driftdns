import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT = "driftdns-salt-v1";

/**
 * Derives a 32-byte key from the DRIFTDNS_SECRET environment variable.
 */
function getDerivedKey(): Buffer {
    const secret = process.env.DRIFTDNS_SECRET;
    if (!secret) {
        throw new Error("DRIFTDNS_SECRET environment variable is not set");
    }
    return crypto.scryptSync(secret, SALT, 32);
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns a base64 string in the format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
    const key = getDerivedKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString("base64");
}

/**
 * Decrypts a base64-encoded ciphertext produced by `encrypt`.
 */
export function decrypt(ciphertext: string): string {
    const key = getDerivedKey();
    const combined = Buffer.from(ciphertext, "base64");

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}
