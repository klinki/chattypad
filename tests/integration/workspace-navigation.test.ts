/**
 * Integration tests for workspace load and thread selection (User Story 1).
 * Tests the IPC handlers directly using an in-memory database.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { createTestDatabase } from "../../src/main/database/sqlite.js";
import { initializeSchema } from "../../src/main/database/schema.js";
import { seedDevelopmentData } from "../../src/main/database/seed.js";
import { createWorkspaceHandlers } from "../../src/main/ipc/workspace-ipc.js";

let db: Database;

beforeEach(() => {
  db = createTestDatabase();
  initializeSchema(db);
  seedDevelopmentData(db);
});

afterEach(() => {
  db.close();
});

describe("workspace:load handler (US1)", () => {
  test("returns a WorkspaceSnapshot with projects and threads", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleWorkspaceLoad();

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.projects.length).toBeGreaterThan(0);
    for (const project of result.data.projects) {
      expect(result.data.threadsByProject[project.id]).toBeDefined();
    }
  });

  test("returns empty collections when no data exists (FR-012)", () => {
    const emptyDb = createTestDatabase();
    initializeSchema(emptyDb);
    const handlers = createWorkspaceHandlers(emptyDb);
    const result = handlers.handleWorkspaceLoad();

    expect(result.success).toBe(true);
    if (!result.success) {
      emptyDb.close();
      return;
    }

    expect(result.data.projects).toHaveLength(0);
    expect(result.data.activeThreadId).toBeNull();
    emptyDb.close();
  });

  test("projects are returned with required fields (ProjectSummary shape)", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleWorkspaceLoad();
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    for (const project of result.data.projects) {
      expect(typeof project.id).toBe("string");
      expect(typeof project.name).toBe("string");
      expect(typeof project.sortOrder).toBe("number");
    }
  });
});

describe("thread:open handler (US1/US2)", () => {
  test("returns ActiveThreadDetail for a valid thread ID", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleThreadOpen("thread-001");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.thread.id).toBe("thread-001");
    expect(result.data.messages.length).toBeGreaterThan(0);
  });

  test("returns messages in chronological order (FR-006)", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleThreadOpen("thread-001");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const seqs = result.data.messages.map((m) => m.sequenceNumber);
    for (let i = 1; i < seqs.length; i += 1) {
      expect(seqs[i]).toBeGreaterThan(seqs[i - 1] as number);
    }
  });

  test("returns error for non-existent thread ID", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleThreadOpen("thread-does-not-exist");
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.code).toBeTruthy();
  });

  test("returns error for empty thread ID", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleThreadOpen("");
    expect(result.success).toBe(false);
  });

  test("empty thread returns thread detail with no messages", () => {
    const handlers = createWorkspaceHandlers(db);
    const result = handlers.handleThreadOpen("thread-007");
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.messages).toHaveLength(0);
  });
});
