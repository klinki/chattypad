import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { createTestDatabase } from "../../src/main/database/sqlite.js";
import { initializeSchema } from "../../src/main/database/schema.js";
import {
  insertMessage,
  insertProject,
  insertThread,
} from "../../src/main/database/workspace-repository.js";
import { searchWorkspace } from "../../src/main/app/search-service.js";
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

describe("searchWorkspace", () => {
  test("returns no results for a one-character query", async () => {
    const result = await searchWorkspace(db, "a");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toEqual([]);
  });

  test("supports two-character substring matches via fallback search", async () => {
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
      title: "Alpha thread",
      sortOrder: 0,
      createdAt: "2026-04-07T08:01:00.000Z",
      updatedAt: "2026-04-07T08:01:00.000Z",
      lastMessageAt: null,
    });

    const result = await searchWorkspace(db, "ph");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.map((entry) => entry.id)).toEqual(["thread:t1"]);
  });

  test("orders thread prefix matches before thread substring and message matches", async () => {
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
      id: "t-prefix",
      projectId: "p1",
      title: "search launch",
      sortOrder: 0,
      createdAt: "2026-04-07T08:01:00.000Z",
      updatedAt: "2026-04-07T08:01:00.000Z",
      lastMessageAt: "2026-04-07T10:03:00.000Z",
    });
    insertThread(db, {
      id: "t-substring",
      projectId: "p1",
      title: "Daily search review",
      sortOrder: 1,
      createdAt: "2026-04-07T08:02:00.000Z",
      updatedAt: "2026-04-07T08:02:00.000Z",
      lastMessageAt: "2026-04-07T10:02:00.000Z",
    });
    insertThread(db, {
      id: "t-message",
      projectId: "p1",
      title: "Notes",
      sortOrder: 2,
      createdAt: "2026-04-07T08:03:00.000Z",
      updatedAt: "2026-04-07T08:03:00.000Z",
      lastMessageAt: "2026-04-07T10:04:00.000Z",
    });
    insertMessage(db, {
      id: "m1",
      threadId: "t-message",
      role: "user",
      content: "This message includes search details.",
      sequenceNumber: 1,
      createdAt: "2026-04-07T10:04:00.000Z",
    });
    initializeSchema(db);

    const result = await searchWorkspace(db, "search");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.map((entry) => entry.id)).toEqual([
      "thread:t-prefix",
      "thread:t-substring",
      "message:m1",
    ]);
  });

  test("builds compact snippets around the first message match", async () => {
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
      title: "Notes",
      sortOrder: 0,
      createdAt: "2026-04-07T08:01:00.000Z",
      updatedAt: "2026-04-07T08:01:00.000Z",
      lastMessageAt: "2026-04-07T10:00:00.000Z",
    });
    insertMessage(db, {
      id: "m1",
      threadId: "t1",
      role: "assistant",
      content: "A long body of text that eventually mentions launch-control near the end of the paragraph.",
      sequenceNumber: 1,
      createdAt: "2026-04-07T10:00:00.000Z",
    });
    initializeSchema(db);

    const result = await searchWorkspace(db, "launch");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data[0]?.snippet).toContain("launch-control");
    expect(result.data[0]?.snippet.length).toBeLessThan(90);
  });

  test("excludes locked encrypted content and includes it once unlocked", async () => {
    const salt = CryptoService.generateSalt();
    const key = await CryptoService.deriveKey("secret-password", salt);
    insertProject(db, {
      id: "p-secure",
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
      id: "t-secure",
      projectId: "p-secure",
      title: await CryptoService.encrypt("Launch plans", key),
      sortOrder: 0,
      createdAt: "2026-04-07T08:01:00.000Z",
      updatedAt: "2026-04-07T08:01:00.000Z",
      lastMessageAt: "2026-04-07T10:00:00.000Z",
    });
    insertMessage(db, {
      id: "m-secure",
      threadId: "t-secure",
      role: "user",
      content: await CryptoService.encrypt("The launch checklist is encrypted.", key),
      sequenceNumber: 1,
      createdAt: "2026-04-07T10:00:00.000Z",
    });

    const lockedResult = await searchWorkspace(db, "launch");
    expect(lockedResult.success).toBe(true);
    if (!lockedResult.success) {
      return;
    }
    expect(lockedResult.data).toEqual([]);

    sessionKeys.set("p-secure", key);
    const unlockedResult = await searchWorkspace(db, "launch");
    expect(unlockedResult.success).toBe(true);
    if (!unlockedResult.success) {
      return;
    }

    expect(unlockedResult.data.map((entry) => entry.id)).toEqual([
      "thread:t-secure",
      "message:m-secure",
    ]);
  });
});
