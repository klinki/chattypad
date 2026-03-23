/**
 * Unit tests for the workspace repository layer.
 * Tests: CRUD operations, ordering, cascade deletes, and sequence number generation.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { createTestDatabase } from "../../src/main/database/sqlite.js";
import { initializeSchema } from "../../src/main/database/schema.js";
import {
  deleteProject,
  getAllProjects,
  getNextProjectSortOrder,
  getProjectById,
  insertProject,
  getAllThreadsByProject,
  getNextThreadSortOrder,
  getThreadById,
  insertThread,
  updateThreadTimestamps,
  getMessagesByThread,
  getNextSequenceNumber,
  insertMessage,
  projectToSummary,
  threadToSummary,
  messageToView,
} from "../../src/main/database/workspace-repository.js";
import type { Project, ChatThread, Message } from "../../src/shared/models/workspace.js";

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function makeProject(overrides?: Partial<Project>): Project {
  return {
    id: "proj-test",
    name: "Test Project",
    sortOrder: 0,
    groupId: null,
    isCollapsed: false,
    isEncrypted: false,
    passwordHash: null,
    encryptionSalt: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeThread(overrides?: Partial<ChatThread>): ChatThread {
  return {
    id: "thread-test",
    projectId: "proj-test",
    title: "Test Thread",
    sortOrder: 0, createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    lastMessageAt: null,
    ...overrides,
  };
}

function makeMessage(overrides?: Partial<Message>): Message {
  return {
    id: "msg-test",
    threadId: "thread-test",
    role: "user",
    content: "Test message",
    sequenceNumber: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// ─── Test setup ────────────────────────────────────────────────────────────────

let db: Database;

beforeEach(() => {
  db = createTestDatabase();
  initializeSchema(db);
});

afterEach(() => {
  db.close();
});

// ─── Project tests ─────────────────────────────────────────────────────────────

describe("Project repository", () => {
  test("insertProject and getProjectById round-trips correctly", () => {
    const project = makeProject();
    insertProject(db, project);
    const result = getProjectById(db, project.id);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(project.id);
    expect(result?.name).toBe(project.name);
    expect(result?.sortOrder).toBe(project.sortOrder);
  });

  test("getAllProjects returns projects ordered by sort_order", () => {
    insertProject(db, makeProject({ id: "proj-b", name: "B", sortOrder: 2 }));
    insertProject(db, makeProject({ id: "proj-a", name: "A", sortOrder: 0 }));
    insertProject(db, makeProject({ id: "proj-c", name: "C", sortOrder: 1 }));
    const result = getAllProjects(db);
    expect(result.map((p) => p.name)).toEqual(["A", "C", "B"]);
  });

  test("getProjectById returns null for non-existent id", () => {
    expect(getProjectById(db, "no-such-project")).toBeNull();
  });

  test("projectToSummary maps fields correctly", () => {
    const project = makeProject({ id: "p1", name: "My Project", sortOrder: 5 });
    const summary = projectToSummary(project);
    expect(summary).toEqual({
      id: "p1",
      name: "My Project",
      sortOrder: 5,
      groupId: null,
      isCollapsed: false,
      isEncrypted: false,
      isLocked: false,
      encryptionSalt: null,
    });
  });

  test("getNextProjectSortOrder returns the next available sort order", () => {
    insertProject(db, makeProject({ id: "proj-a", sortOrder: 1 }));
    insertProject(db, makeProject({ id: "proj-b", sortOrder: 4 }));
    expect(getNextProjectSortOrder(db)).toBe(5);
  });

  test("deleteProject removes the project and cascades related rows", () => {
    insertProject(db, makeProject());
    insertThread(db, makeThread());
    insertMessage(db, makeMessage());

    deleteProject(db, "proj-test");

    expect(getProjectById(db, "proj-test")).toBeNull();
    expect(getThreadById(db, "thread-test")).toBeNull();
    expect(getMessagesByThread(db, "thread-test")).toHaveLength(0);
  });
});

// ─── Thread tests ──────────────────────────────────────────────────────────────

describe("Thread repository", () => {
  beforeEach(() => {
    insertProject(db, makeProject());
  });

  test("insertThread and getThreadById round-trips correctly", () => {
    const thread = makeThread();
    insertThread(db, thread);
    const result = getThreadById(db, thread.id);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(thread.id);
    expect(result?.projectId).toBe(thread.projectId);
    expect(result?.title).toBe(thread.title);
    expect(result?.lastMessageAt).toBeNull();
  });

  test("getAllThreadsByProject returns threads ordered by sort_order", () => {
    insertThread(db, makeThread({ id: "t-b", title: "B", sortOrder: 2 }));
    insertThread(db, makeThread({ id: "t-a", title: "A", sortOrder: 0 }));
    insertThread(db, makeThread({ id: "t-c", title: "C", sortOrder: 1 }));
    const result = getAllThreadsByProject(db, "proj-test");
    expect(result.map((t) => t.title)).toEqual(["A", "C", "B"]);
  });

  test("getNextThreadSortOrder returns the next available sort order for a project", () => {
    insertThread(db, makeThread({ id: "t-a", sortOrder: 1 }));
    insertThread(db, makeThread({ id: "t-b", sortOrder: 4 }));
    expect(getNextThreadSortOrder(db, "proj-test")).toBe(5);
  });

  test("getThreadById returns null for non-existent id", () => {
    expect(getThreadById(db, "no-such-thread")).toBeNull();
  });

  test("updateThreadTimestamps updates the relevant fields", () => {
    const thread = makeThread();
    insertThread(db, thread);
    const newUpdated = "2024-06-01T12:00:00.000Z";
    const newLastMsg = "2024-06-01T12:00:00.000Z";
    updateThreadTimestamps(db, thread.id, newUpdated, newLastMsg);
    const result = getThreadById(db, thread.id);
    expect(result?.updatedAt).toBe(newUpdated);
    expect(result?.lastMessageAt).toBe(newLastMsg);
  });

  test("threadToSummary maps fields correctly including lastMessageAt null", () => {
    const thread = makeThread({ lastMessageAt: null });
    const summary = threadToSummary(thread);
    expect(summary.lastMessageAt).toBeNull();
  });
});

// ─── Message tests ─────────────────────────────────────────────────────────────

describe("Message repository", () => {
  beforeEach(() => {
    insertProject(db, makeProject());
    insertThread(db, makeThread());
  });

  test("insertMessage and getMessagesByThread round-trips correctly", () => {
    const message = makeMessage();
    insertMessage(db, message);
    const result = getMessagesByThread(db, message.threadId);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(message.id);
    expect(result[0]?.content).toBe(message.content);
    expect(result[0]?.role).toBe("user");
  });

  test("getMessagesByThread returns messages in sequence_number order (FR-006)", () => {
    insertMessage(db, makeMessage({ id: "m3", sequenceNumber: 3, content: "Third" }));
    insertMessage(db, makeMessage({ id: "m1", sequenceNumber: 1, content: "First" }));
    insertMessage(db, makeMessage({ id: "m2", sequenceNumber: 2, content: "Second" }));
    const result = getMessagesByThread(db, "thread-test");
    expect(result.map((m) => m.content)).toEqual(["First", "Second", "Third"]);
  });

  test("getNextSequenceNumber returns 1 when thread has no messages", () => {
    expect(getNextSequenceNumber(db, "thread-test")).toBe(1);
  });

  test("getNextSequenceNumber increments correctly", () => {
    insertMessage(db, makeMessage({ id: "m1", sequenceNumber: 1 }));
    insertMessage(db, makeMessage({ id: "m2", sequenceNumber: 2 }));
    expect(getNextSequenceNumber(db, "thread-test")).toBe(3);
  });

  test("messageToView maps fields correctly", () => {
    const message = makeMessage({ sequenceNumber: 7, role: "assistant" });
    const view = messageToView(message);
    expect(view.sequenceNumber).toBe(7);
    expect(view.role).toBe("assistant");
  });
});
