/**
 * Unit tests for message creation and validation (User Story 3).
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { createTestDatabase } from "../../src/main/database/sqlite.js";
import { initializeSchema } from "../../src/main/database/schema.js";
import {
  insertProject,
  insertThread,
  getMessagesByThread,
  getThreadById,
} from "../../src/main/database/workspace-repository.js";
import { sendMessage } from "../../src/main/app/message-service.js";

let db: Database;

beforeEach(() => {
  db = createTestDatabase();
  initializeSchema(db);
  insertProject(db, {
    id: "p1",
    name: "Test Project",
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });
  insertThread(db, {
    id: "t1",
    projectId: "p1",
    title: "Test Thread",
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    lastMessageAt: null,
  });
});

afterEach(() => {
  db.close();
});

describe("sendMessage validation (FR-009)", () => {
  test("rejects empty content", () => {
    const result = sendMessage(db, { threadId: "t1", content: "", role: "user" });
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.code).toBe("CONTENT_EMPTY");
  });

  test("rejects whitespace-only content", () => {
    const result = sendMessage(db, {
      threadId: "t1",
      content: "   \t\n  ",
      role: "user",
    });
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.code).toBe("CONTENT_EMPTY");
  });

  test("rejects missing thread ID", () => {
    const result = sendMessage(db, { threadId: "", content: "Hello", role: "user" });
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.code).toBe("THREAD_ID_REQUIRED");
  });

  test("rejects non-existent thread ID", () => {
    const result = sendMessage(db, {
      threadId: "no-such-thread",
      content: "Hello",
      role: "user",
    });
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.code).toBe("THREAD_NOT_FOUND");
  });
});

describe("sendMessage persistence (FR-010)", () => {
  test("persists a valid message", () => {
    const result = sendMessage(db, {
      threadId: "t1",
      content: "Hello, world!",
      role: "user",
    });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    const messages = getMessagesByThread(db, "t1");
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toBe("Hello, world!");
  });

  test("trims content before storing", () => {
    const result = sendMessage(db, { threadId: "t1", content: "  trimmed  ", role: "user" });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    const messages = getMessagesByThread(db, "t1");
    expect(messages[0]?.content).toBe("trimmed");
  });

  test("assigns sequential sequence numbers", () => {
    sendMessage(db, { threadId: "t1", content: "First", role: "user" });
    sendMessage(db, { threadId: "t1", content: "Second", role: "assistant" });
    sendMessage(db, { threadId: "t1", content: "Third", role: "user" });
    const messages = getMessagesByThread(db, "t1");
    expect(messages.map((m) => m.sequenceNumber)).toEqual([1, 2, 3]);
  });

  test("returns refreshed ActiveThreadDetail including the new message", () => {
    const result = sendMessage(db, { threadId: "t1", content: "New message", role: "user" });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.messages.some((m) => m.content === "New message")).toBe(true);
  });

  test("updates thread lastMessageAt after send", () => {
    sendMessage(db, { threadId: "t1", content: "Update timestamp", role: "user" });
    const thread = getThreadById(db, "t1");
    expect(thread?.lastMessageAt).not.toBeNull();
  });

  test("recoverable send error has recoverable flag true", () => {
    const result = sendMessage(db, { threadId: "t1", content: "", role: "user" });
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.recoverable).toBe(true);
  });
});
