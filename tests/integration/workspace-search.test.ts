import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { createTestDatabase } from "../../src/main/database/sqlite.js";
import { initializeSchema } from "../../src/main/database/schema.js";
import {
  insertMessage,
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

describe("workspace:search IPC handler", () => {
  test("returns FTS-backed thread and message matches for unencrypted content", async () => {
    insertProject(db, {
      id: "p1",
      name: "Workspace",
      sortOrder: 0,
      groupId: null,
      isCollapsed: false,
      isEncrypted: false,
      passwordHash: null,
      encryptionSalt: null,
      createdAt: "2026-04-07T08:00:00.000Z",
      updatedAt: "2026-04-07T08:00:00.000Z",
    });
    insertThread(db, {
      id: "t1",
      projectId: "p1",
      title: "Launch notes",
      sortOrder: 0,
      createdAt: "2026-04-07T08:01:00.000Z",
      updatedAt: "2026-04-07T08:01:00.000Z",
      lastMessageAt: "2026-04-07T10:00:00.000Z",
    });
    insertMessage(db, {
      id: "m1",
      threadId: "t1",
      role: "assistant",
      content: "Remember the launch checklist.",
      sequenceNumber: 1,
      createdAt: "2026-04-07T10:00:00.000Z",
    });
    initializeSchema(db);

    const handlers = createWorkspaceHandlers(db);
    const result = await handlers.handleWorkspaceSearch("launch", 25);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.map((entry) => entry.id)).toEqual(["thread:t1", "message:m1"]);
  });

  test("includes decrypted matches only for unlocked encrypted projects", async () => {
    const salt = CryptoService.generateSalt();
    const key = await CryptoService.deriveKey("secret-password", salt);
    insertProject(db, {
      id: "p1",
      name: "Secure",
      sortOrder: 0,
      groupId: null,
      isCollapsed: false,
      isEncrypted: true,
      passwordHash: "unused",
      encryptionSalt: CryptoService.arrayBufferToBase64(salt),
      createdAt: "2026-04-07T08:00:00.000Z",
      updatedAt: "2026-04-07T08:00:00.000Z",
    });
    insertThread(db, {
      id: "t1",
      projectId: "p1",
      title: await CryptoService.encrypt("Launch notes", key),
      sortOrder: 0,
      createdAt: "2026-04-07T08:01:00.000Z",
      updatedAt: "2026-04-07T08:01:00.000Z",
      lastMessageAt: "2026-04-07T10:00:00.000Z",
    });
    insertMessage(db, {
      id: "m1",
      threadId: "t1",
      role: "assistant",
      content: await CryptoService.encrypt("Remember the launch checklist.", key),
      sequenceNumber: 1,
      createdAt: "2026-04-07T10:00:00.000Z",
    });

    const handlers = createWorkspaceHandlers(db);
    const lockedResult = await handlers.handleWorkspaceSearch("launch", 25);
    expect(lockedResult.success).toBe(true);
    if (!lockedResult.success) {
      return;
    }
    expect(lockedResult.data).toEqual([]);

    sessionKeys.set("p1", key);
    const unlockedResult = await handlers.handleWorkspaceSearch("launch", 25);
    expect(unlockedResult.success).toBe(true);
    if (!unlockedResult.success) {
      return;
    }

    expect(unlockedResult.data.map((entry) => entry.id)).toEqual(["thread:t1", "message:m1"]);
  });
});
