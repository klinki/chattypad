/**
 * Shared cryptographic services for ChattyPad.
 * Uses the Web Crypto API available in both Bun and modern browsers.
 */

export class CryptoService {
  private static readonly AES_ALGO = "AES-GCM";
  private static readonly PBKDF2_ALGO = "PBKDF2";
  private static readonly HASH_ALGO = "SHA-256";
  private static readonly ITERATIONS = 100000;

  /**
   * Derives an AES-GCM key from a password and salt using PBKDF2.
   */
  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      this.PBKDF2_ALGO,
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: this.PBKDF2_ALGO,
        salt: salt as any,
        iterations: this.ITERATIONS,
        hash: this.HASH_ALGO,
      },
      baseKey,
      { name: this.AES_ALGO, length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypts a string using AES-GCM.
   * Returns a Base64-encoded string containing the IV and ciphertext.
   */
  static async encrypt(text: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: this.AES_ALGO, iv },
      key,
      encoder.encode(text)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypts a Base64-encoded string (IV + ciphertext) using AES-GCM.
   */
  static async decrypt(base64Data: string, key: CryptoKey): Promise<string> {
    const combined = new Uint8Array(
      atob(base64Data)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: this.AES_ALGO, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Generates a random salt.
   */
  static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Helper to convert Uint8Array to Base64.
   */
  static arrayBufferToBase64(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer));
  }

  /**
   * Helper to convert Base64 to Uint8Array.
   */
  static base64ToUint8Array(base64: string): Uint8Array {
    return new Uint8Array(
      atob(base64)
        .split("")
        .map((c) => c.charCodeAt(0))
    );
  }
}
