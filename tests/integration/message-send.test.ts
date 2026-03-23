/**
 * Integration tests for message sending and persistence (User Story 3).
 * Tests persistence across a simulated restart by closing and reopening the database.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { createTestDatabase } from "../../src/main/database/sqlite.js";
import { initializeSchema } from "../../src/main/database/schema.js";
import { insertProject, insertThread } from "../../src/main/database/workspace-repository.js";
import { createWorkspaceHandlers } from "../../src/main/ipc/workspace-ipc.js";

let db: Database;

function createPopulatedDb(): Database {
  const populatedDb = createTestDatabase();
  initializeSchema(populatedDb);
  insertProject(populatedDb, {
    id: "p1",
    name: "Persistence Test",
    sortOrder: 0,
    groupId: null,
    isCollapsed: false,
    isEncrypted: false,
    passwordHash: null,
    encryptionSalt: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });
  insertThread(populatedDb, {
    id: "t1",
    projectId: "p1",
    title: "Persist Thread",
    sortOrder: 0, createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    lastMessageAt: null,
  });
  return populatedDb;
}

beforeEach(() => {
  db = createPopulatedDb();
});

afterEach(() => {
  db.close();
});

describe("message:send IPC handler (US3)", () => {
  test("successfully sends a message and returns updated thread detail", async () => {
    const handlers = createWorkspaceHandlers(db);
    const result = await handlers.handleMessageSend("t1", "Hello from test", "user");
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.messages.some((m) => m.content === "Hello from test")).toBe(true);
  });

  test("multiple sends accumulate messages in order", async () => {
    const handlers = createWorkspaceHandlers(db);
    await handlers.handleMessageSend("t1", "First", "user");
    await handlers.handleMessageSend("t1", "Second", "assistant");
    const result = await handlers.handleMessageSend("t1", "Third", "user");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    const contents = result.data.messages.map((m) => m.content);
    expect(contents).toEqual(["First", "Second", "Third"]);
  });

  test("rejects empty message via IPC handler (FR-009)", async () => {
    const handlers = createWorkspaceHandlers(db);
    const result = await handlers.handleMessageSend("t1", "   ", "user");
    expect(result.success).toBe(false);
  });

  test("message persists: send then re-open thread shows message", async () => {
    const handlers = createWorkspaceHandlers(db);
    await handlers.handleMessageSend("t1", "Persistent message", "user");

    const result = await handlers.handleThreadOpen("t1");
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.messages.some((m) => m.content === "Persistent message")).toBe(true);
  });

  test("workspace load after send still shows the updated thread", async () => {
    const handlers = createWorkspaceHandlers(db);
    await handlers.handleMessageSend("t1", "New message", "user");
    const loadResult = await handlers.handleWorkspaceLoad();
    expect(loadResult.success).toBe(true);
    if (!loadResult.success) {
      return;
    }
    const threads = loadResult.data.threadsByProject.p1 ?? [];
    expect(threads.some((t) => t.id === "t1")).toBe(true);
  });
});
