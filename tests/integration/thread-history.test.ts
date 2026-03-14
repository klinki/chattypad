/**
 * Integration tests for conversation history loading (User Story 2).
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { createTestDatabase } from "../../src/main/database/sqlite.js";
import { initializeSchema } from "../../src/main/database/schema.js";
import {
  insertProject,
  insertThread,
  insertMessage,
} from "../../src/main/database/workspace-repository.js";
import { createWorkspaceHandlers } from "../../src/main/ipc/workspace-ipc.js";

let db: Database;

beforeEach(() => {
  db = createTestDatabase();
  initializeSchema(db);
  insertProject(db, {
    id: "p1",
    name: "History Test",
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });
  insertThread(db, {
    id: "t1",
    projectId: "p1",
    title: "Long Thread",
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    lastMessageAt: null,
  });
  for (let i = 1; i <= 10; i += 1) {
    insertMessage(db, {
      id: `m${i}`,
      threadId: "t1",
      role: i % 2 === 0 ? "assistant" : "user",
      content: `Message number ${i}`,
      sequenceNumber: i,
      createdAt: new Date(Date.UTC(2024, 0, 1, 0, i)).toISOString(),
    });
  }
});

afterEach(() => {
  db.close();
});

describe("Thread history loading (US2)", () => {
  test("loads all messages for a thread", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleThreadOpen("t1");
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.messages).toHaveLength(10);
  });

  test("messages are ordered oldest first (sequenceNumber ASC)", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleThreadOpen("t1");
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    const seqs = result.data.messages.map((m) => m.sequenceNumber);
    expect(seqs).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test("each message has all required MessageView fields", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleThreadOpen("t1");
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    for (const msg of result.data.messages) {
      expect(typeof msg.id).toBe("string");
      expect(typeof msg.threadId).toBe("string");
      expect(typeof msg.role).toBe("string");
      expect(typeof msg.content).toBe("string");
      expect(typeof msg.sequenceNumber).toBe("number");
      expect(typeof msg.createdAt).toBe("string");
    }
  });

  test("thread metadata is included in response", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleThreadOpen("t1");
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.thread.id).toBe("t1");
    expect(result.data.thread.title).toBe("Long Thread");
  });
});
