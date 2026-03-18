import { expect, test, describe } from "bun:test";
import { CryptoService } from "../../src/shared/crypto/crypto-service.js";

describe("CryptoService", () => {
  test("should derive keys consistently from same password and salt", async () => {
    const password = "test-password";
    const salt = CryptoService.generateSalt();

    const key1 = await CryptoService.deriveKey(password, salt);
    const key2 = await CryptoService.deriveKey(password, salt);

    // Export keys to compare their raw bytes
    const exported1 = await crypto.subtle.exportKey("raw", key1);
    const exported2 = await crypto.subtle.exportKey("raw", key2);

    expect(new Uint8Array(exported1)).toEqual(new Uint8Array(exported2));
  });

  test("should encrypt and decrypt correctly", async () => {
    const password = "secure-password";
    const salt = CryptoService.generateSalt();
    const key = await CryptoService.deriveKey(password, salt);
    const originalText = "Sensitive information";

    const encrypted = await CryptoService.encrypt(originalText, key);
    expect(encrypted).not.toBe(originalText);

    const decrypted = await CryptoService.decrypt(encrypted, key);
    expect(decrypted).toBe(originalText);
  });

  test("should fail to decrypt with wrong key", async () => {
    const salt = CryptoService.generateSalt();
    const key1 = await CryptoService.deriveKey("pass1", salt);
    const key2 = await CryptoService.deriveKey("pass2", salt);
    const originalText = "Sensitive information";

    const encrypted = await CryptoService.encrypt(originalText, key1);

    await expect(CryptoService.decrypt(encrypted, key2)).rejects.toThrow();
  });
});
