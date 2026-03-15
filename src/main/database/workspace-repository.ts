/**
 * Data access layer for the workspace feature.
 * Provides project, thread, and message repository operations.
 */
import type { Database } from "bun:sqlite";
import type { Project, ChatThread, Message, MessageRole } from "../../shared/models/workspace.js";
import { MESSAGE_ROLES } from "../../shared/models/workspace.js";
import type { ProjectSummary, ThreadSummary, MessageView } from "../../shared/contracts/workspace.js";

// ─── Raw DB row types ──────────────────────────────────────────────────────────

interface ProjectRow {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ThreadRow {
  id: string;
  project_id: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

interface MessageRow {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  sequence_number: number;
  created_at: string;
}

// ─── Mapping helpers ───────────────────────────────────────────────────────────

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToThread(row: ThreadRow): ChatThread {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at ?? null,
  };
}

function rowToMessage(row: MessageRow): Message {
  const role = MESSAGE_ROLES.has(row.role as MessageRole)
    ? (row.role as MessageRole)
    : "user";
  return {
    id: row.id,
    threadId: row.thread_id,
    role,
    content: row.content,
    sequenceNumber: row.sequence_number,
    createdAt: row.created_at,
  };
}

// ─── Project repository ────────────────────────────────────────────────────────

export function getAllProjects(db: Database): Project[] {
  const rows = db
    .query<ProjectRow, []>("SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC")
    .all();
  return rows.map(rowToProject);
}

export function getProjectById(db: Database, id: string): Project | null {
  const row = db
    .query<ProjectRow, [string]>("SELECT * FROM projects WHERE id = ?")
    .get(id);
  return row ? rowToProject(row) : null;
}

export function insertProject(db: Database, project: Project): void {
  db.run(
    `INSERT INTO projects (id, name, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [project.id, project.name, project.sortOrder, project.createdAt, project.updatedAt]
  );
}

export function deleteProject(db: Database, projectId: string): void {
  db.run("DELETE FROM projects WHERE id = ?", [projectId]);
}

export function getNextProjectSortOrder(db: Database): number {
  const result = db
    .query<{ max_sort_order: number | null }, []>(
      "SELECT MAX(sort_order) AS max_sort_order FROM projects"
    )
    .get();
  return (result?.max_sort_order ?? -1) + 1;
}

// ─── Thread repository ─────────────────────────────────────────────────────────

export function getAllThreadsByProject(db: Database, projectId: string): ChatThread[] {
  const rows = db
    .query<ThreadRow, [string]>(
      "SELECT * FROM chat_threads WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC"
    )
    .all(projectId);
  return rows.map(rowToThread);
}

export function getThreadById(db: Database, id: string): ChatThread | null {
  const row = db
    .query<ThreadRow, [string]>("SELECT * FROM chat_threads WHERE id = ?")
    .get(id);
  return row ? rowToThread(row) : null;
}

export function insertThread(db: Database, thread: ChatThread): void {
  db.run(
    `INSERT INTO chat_threads (id, project_id, title, sort_order, created_at, updated_at, last_message_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      thread.id,
      thread.projectId,
      thread.title,
      thread.sortOrder,
      thread.createdAt,
      thread.updatedAt,
      thread.lastMessageAt,
    ]
  );
}

export function updateThreadTimestamps(
  db: Database,
  threadId: string,
  updatedAt: string,
  lastMessageAt: string
): void {
  db.run(
    "UPDATE chat_threads SET updated_at = ?, last_message_at = ? WHERE id = ?",
    [updatedAt, lastMessageAt, threadId]
  );
}

// ─── Message repository ────────────────────────────────────────────────────────

/**
 * Returns all messages for a thread, ordered chronologically by sequence number.
 * Supports FR-006: messages displayed in chronological order.
 */
export function getMessagesByThread(db: Database, threadId: string): Message[] {
  const rows = db
    .query<MessageRow, [string]>(
      "SELECT * FROM messages WHERE thread_id = ? ORDER BY sequence_number ASC"
    )
    .all(threadId);
  return rows.map(rowToMessage);
}

/**
 * Returns the next sequence number for a thread (max existing + 1, or 1 if no messages).
 */
export function getNextSequenceNumber(db: Database, threadId: string): number {
  const result = db
    .query<{ max_seq: number | null }, [string]>(
      "SELECT MAX(sequence_number) AS max_seq FROM messages WHERE thread_id = ?"
    )
    .get(threadId);
  return (result?.max_seq ?? 0) + 1;
}

export function insertMessage(db: Database, message: Message): void {
  db.run(
    `INSERT INTO messages (id, thread_id, role, content, sequence_number, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.threadId,
      message.role,
      message.content,
      message.sequenceNumber,
      message.createdAt,
    ]
  );
}

// ─── View mapping for IPC contracts ───────────────────────────────────────────

export function projectToSummary(p: Project): ProjectSummary {
  return { id: p.id, name: p.name, sortOrder: p.sortOrder };
}

export function threadToSummary(t: ChatThread): ThreadSummary {
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    sortOrder: t.sortOrder,
    lastMessageAt: t.lastMessageAt,
  };
}

export function messageToView(m: Message): MessageView {
  return {
    id: m.id,
    threadId: m.threadId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
    sequenceNumber: m.sequenceNumber,
  };
}
