import type { Database } from "bun:sqlite";

interface ThreadIndexRow {
  thread_id: string;
  project_id: string;
  title: string;
  activity_at: string | null;
}

interface MessageIndexRow {
  message_id: string;
  thread_id: string;
  project_id: string;
  content: string;
  created_at: string;
}

export interface UnencryptedThreadSearchRow {
  project_id: string;
  project_name: string;
  thread_id: string;
  thread_title: string;
  activity_at: string | null;
}

export interface UnencryptedMessageSearchRow {
  project_id: string;
  project_name: string;
  thread_id: string;
  thread_title: string;
  message_id: string;
  content: string;
  created_at: string;
  activity_at: string | null;
}

export function rebuildSearchIndexes(db: Database): void {
  db.exec("DELETE FROM thread_search_index;");
  db.exec("DELETE FROM message_search_index;");

  db.exec(`
    INSERT INTO thread_search_index (thread_id, project_id, title, activity_at)
    SELECT
      t.id,
      t.project_id,
      t.title,
      COALESCE(t.last_message_at, t.updated_at)
    FROM chat_threads t
    INNER JOIN projects p ON p.id = t.project_id
    WHERE p.is_encrypted = 0;
  `);

  db.exec(`
    INSERT INTO message_search_index (message_id, thread_id, project_id, content, created_at)
    SELECT
      m.id,
      m.thread_id,
      t.project_id,
      m.content,
      m.created_at
    FROM messages m
    INNER JOIN chat_threads t ON t.id = m.thread_id
    INNER JOIN projects p ON p.id = t.project_id
    WHERE p.is_encrypted = 0;
  `);
}

export function deleteSearchEntriesForProject(db: Database, projectId: string): void {
  db.run("DELETE FROM thread_search_index WHERE project_id = ?", [projectId]);
  db.run("DELETE FROM message_search_index WHERE project_id = ?", [projectId]);
}

export function deleteThreadSearchEntry(db: Database, threadId: string): void {
  db.run("DELETE FROM thread_search_index WHERE thread_id = ?", [threadId]);
  db.run("DELETE FROM message_search_index WHERE thread_id = ?", [threadId]);
}

export function upsertThreadSearchEntry(db: Database, threadId: string): void {
  deleteThreadSearchEntry(db, threadId);

  const row = db
    .query<ThreadIndexRow, [string]>(
      `
        SELECT
          t.id AS thread_id,
          t.project_id,
          t.title,
          COALESCE(t.last_message_at, t.updated_at) AS activity_at
        FROM chat_threads t
        INNER JOIN projects p ON p.id = t.project_id
        WHERE t.id = ? AND p.is_encrypted = 0
      `
    )
    .get(threadId);

  if (!row) {
    return;
  }

  db.run(
    `
      INSERT INTO thread_search_index (thread_id, project_id, title, activity_at)
      VALUES (?, ?, ?, ?)
    `,
    [row.thread_id, row.project_id, row.title, row.activity_at]
  );
}

export function upsertMessageSearchEntry(db: Database, messageId: string): void {
  db.run("DELETE FROM message_search_index WHERE message_id = ?", [messageId]);

  const row = db
    .query<MessageIndexRow, [string]>(
      `
        SELECT
          m.id AS message_id,
          m.thread_id,
          t.project_id,
          m.content,
          m.created_at
        FROM messages m
        INNER JOIN chat_threads t ON t.id = m.thread_id
        INNER JOIN projects p ON p.id = t.project_id
        WHERE m.id = ? AND p.is_encrypted = 0
      `
    )
    .get(messageId);

  if (!row) {
    return;
  }

  db.run(
    `
      INSERT INTO message_search_index (message_id, thread_id, project_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    [row.message_id, row.thread_id, row.project_id, row.content, row.created_at]
  );
}

export function searchUnencryptedThreadEntries(
  db: Database,
  query: string
): UnencryptedThreadSearchRow[] {
  return db
    .query<UnencryptedThreadSearchRow, [string]>(
      `
        SELECT
          t.project_id,
          p.name AS project_name,
          t.id AS thread_id,
          t.title AS thread_title,
          COALESCE(t.last_message_at, t.updated_at) AS activity_at
        FROM thread_search_index idx
        INNER JOIN chat_threads t ON t.id = idx.thread_id
        INNER JOIN projects p ON p.id = t.project_id
        WHERE thread_search_index MATCH ? AND p.is_encrypted = 0
      `
    )
    .all(query);
}

export function searchUnencryptedThreadEntriesBySubstring(
  db: Database,
  query: string
): UnencryptedThreadSearchRow[] {
  return db
    .query<UnencryptedThreadSearchRow, [string]>(
      `
        SELECT
          t.project_id,
          p.name AS project_name,
          t.id AS thread_id,
          t.title AS thread_title,
          COALESCE(t.last_message_at, t.updated_at) AS activity_at
        FROM chat_threads t
        INNER JOIN projects p ON p.id = t.project_id
        WHERE p.is_encrypted = 0 AND lower(t.title) LIKE lower(?)
      `
    )
    .all(`%${query}%`);
}

export function searchUnencryptedMessageEntries(
  db: Database,
  query: string
): UnencryptedMessageSearchRow[] {
  return db
    .query<UnencryptedMessageSearchRow, [string]>(
      `
        SELECT
          t.project_id,
          p.name AS project_name,
          t.id AS thread_id,
          t.title AS thread_title,
          m.id AS message_id,
          m.content,
          m.created_at,
          COALESCE(t.last_message_at, t.updated_at) AS activity_at
        FROM message_search_index idx
        INNER JOIN messages m ON m.id = idx.message_id
        INNER JOIN chat_threads t ON t.id = m.thread_id
        INNER JOIN projects p ON p.id = t.project_id
        WHERE message_search_index MATCH ? AND p.is_encrypted = 0
      `
    )
    .all(query);
}

export function searchUnencryptedMessageEntriesBySubstring(
  db: Database,
  query: string
): UnencryptedMessageSearchRow[] {
  return db
    .query<UnencryptedMessageSearchRow, [string]>(
      `
        SELECT
          t.project_id,
          p.name AS project_name,
          t.id AS thread_id,
          t.title AS thread_title,
          m.id AS message_id,
          m.content,
          m.created_at,
          COALESCE(t.last_message_at, t.updated_at) AS activity_at
        FROM messages m
        INNER JOIN chat_threads t ON t.id = m.thread_id
        INNER JOIN projects p ON p.id = t.project_id
        WHERE p.is_encrypted = 0 AND lower(m.content) LIKE lower(?)
      `
    )
    .all(`%${query}%`);
}
