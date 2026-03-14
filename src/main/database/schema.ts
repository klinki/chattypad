/**
 * SQLite schema bootstrap for the ChattyPad workspace feature.
 * Creates the projects, chat_threads, and messages tables if they do not exist.
 */
import type { Database } from "bun:sqlite";

export function initializeSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT    PRIMARY KEY NOT NULL,
      name        TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL,
      updated_at  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_threads (
      id              TEXT    PRIMARY KEY NOT NULL,
      project_id      TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title           TEXT    NOT NULL,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL,
      updated_at      TEXT    NOT NULL,
      last_message_at TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT    PRIMARY KEY NOT NULL,
      thread_id       TEXT    NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
      role            TEXT    NOT NULL,
      content         TEXT    NOT NULL,
      sequence_number INTEGER NOT NULL,
      created_at      TEXT    NOT NULL,
      UNIQUE(thread_id, sequence_number)
    );

    CREATE INDEX IF NOT EXISTS idx_threads_project_id    ON chat_threads(project_id);
    CREATE INDEX IF NOT EXISTS idx_threads_sort_order    ON chat_threads(project_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_messages_thread_id    ON messages(thread_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sequence     ON messages(thread_id, sequence_number);
  `);
}
