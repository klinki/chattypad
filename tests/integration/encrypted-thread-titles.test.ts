import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { createTestDatabase } from "../../src/main/database/sqlite.js";
import { initializeSchema } from "../../src/main/database/schema.js";
import {
  getThreadById,
  insertProject,
  insertThread,
} from "../../src/main/database/workspace-repository.js";
import { createWorkspaceHandlers } from "../../src/main/ipc/workspace-ipc.js";
import { CryptoService } from "../../src/shared/crypto/crypto-service.js";
import { sessionKeys } from "../../src/main/app/workspace-service.js";

let db: Database;

beforeEach(() => {
  db = createTestDatabase();
  initializeSchema(db);
  sessionKeys.clear();
});

afterEach(() => {
  sessionKeys.clear();
  db.close();
});

async function seedUnlockedEncryptedProject(): Promise<CryptoKey> {
  const salt = CryptoService.generateSalt();
  const key = await CryptoService.deriveKey("secret-password", salt);

  insertProject(db, {
    id: "p1",
    name: "Encrypted Project",
    sortOrder: 0,
    groupId: null,
    isCollapsed: false,
    isEncrypted: true,
    passwordHash: "unused",
    encryptionSalt: CryptoService.arrayBufferToBase64(salt),
    createdAt: "2026-03-23T09:00:00.000Z",
    updatedAt: "2026-03-23T09:00:00.000Z",
  });

  sessionKeys.set("p1", key);
  return key;
}

describe("encrypted thread titles", () => {
  test("load and open recover legacy plaintext titles in unlocked encrypted projects", async () => {
    await seedUnlockedEncryptedProject();
    insertThread(db, {
      id: "t1",
      projectId: "p1",
      title: "Legacy plaintext title",
      sortOrder: 0,
      createdAt: "2026-03-23T09:05:00.000Z",
      updatedAt: "2026-03-23T09:05:00.000Z",
      lastMessageAt: null,
    });

    const handlers = createWorkspaceHandlers(db);
    const loadResult = await handlers.handleWorkspaceLoad();
    const openResult = await handlers.handleThreadOpen("t1");

    expect(loadResult.success).toBe(true);
    expect(openResult.success).toBe(true);
    if (!loadResult.success || !openResult.success) {
      return;
    }

    expect(loadResult.data.threadsByProject["p1"]?.[0]?.title).toBe("Legacy plaintext title");
    expect(openResult.data.thread.title).toBe("Legacy plaintext title");
  });

  test("thread updates store encrypted titles and still return decrypted values", async () => {
    const key = await seedUnlockedEncryptedProject();
    const encryptedTitle = await CryptoService.encrypt("Original title", key);
    insertThread(db, {
      id: "t1",
      projectId: "p1",
      title: encryptedTitle,
      sortOrder: 0,
      createdAt: "2026-03-23T09:05:00.000Z",
      updatedAt: "2026-03-23T09:05:00.000Z",
      lastMessageAt: null,
    });

    const handlers = createWorkspaceHandlers(db);
    const updateResult = await handlers.handleThreadUpdate("t1", "Renamed secure note");

    expect(updateResult.success).toBe(true);
    if (!updateResult.success) {
      return;
    }

    const storedThread = getThreadById(db, "t1");
    expect(storedThread?.title).not.toBe("Renamed secure note");
    expect(storedThread?.title).toBeTruthy();
    expect(await CryptoService.decrypt(storedThread?.title ?? "", key)).toBe("Renamed secure note");
    expect(updateResult.data.threadsByProject["p1"]?.[0]?.title).toBe("Renamed secure note");
  });
});
