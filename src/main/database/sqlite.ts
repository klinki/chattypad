/**
 * SQLite connection management for ChattyPad.
 * Uses Bun's built-in SQLite driver (bun:sqlite).
 */
import { Database } from "bun:sqlite";
import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_DATABASE_FILENAME } from "../app/settings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let sharedDb: Database | null = null;

const CORRUPT_DATABASE_PATTERNS = [
  "file is not a database",
  "database disk image is malformed",
  "malformed database schema",
];

/**
 * Returns the shared application database instance.
 * Creates the database file at the given path (or a default path) if it does not exist.
 */
export function getDatabase(databaseDir?: string): Database {
  if (!sharedDb) {
    const resolvedPath = resolveDatabasePath(databaseDir);
    try {
      sharedDb = new Database(resolvedPath, { create: true });
      configurePragmas(sharedDb);
    } catch (err) {
      throw toDatabaseError(err, "Failed to open the local workspace database.");
    }
  }
  return sharedDb;
}

/**
 * Resets the shared database reference (useful for tests that manage their own db lifecycle).
 */
export function resetSharedDatabase(): void {
  if (sharedDb) {
    sharedDb.close();
    sharedDb = null;
  }
}

/**
 * Creates an isolated in-memory database for unit and integration tests.
 */
export function createTestDatabase(): Database {
  const db = new Database(":memory:");
  configurePragmas(db);
  return db;
}

export function resolveDatabasePath(databaseDir?: string): string {
  if (!databaseDir) {
    return path.resolve(__dirname, "../../../chattypad.db");
  }

  return path.resolve(databaseDir, DEFAULT_DATABASE_FILENAME);
}

export function toDatabaseError(
  error: unknown,
  fallbackMessage = "The local workspace database is unavailable."
): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  const cause = error instanceof Error ? error : undefined;
  const rawMessage = cause?.message ?? "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (CORRUPT_DATABASE_PATTERNS.some((pattern) => normalizedMessage.includes(pattern))) {
    return new DatabaseError(
      "Saved workspace data is unreadable. Move or delete the local database file to rebuild it.",
      "DB_CORRUPT",
      true,
      cause
    );
  }

  return new DatabaseError(fallbackMessage, "DB_OPEN_FAILED", false, cause);
}

function configurePragmas(db: Database): void {
  db.exec("PRAGMA journal_mode=WAL;");
  db.exec("PRAGMA foreign_keys=ON;");
  db.exec("PRAGMA synchronous=NORMAL;");
}

/** Structured error for database-level failures (supports FR-013 recoverable error states). */
export class DatabaseError extends Error {
  public readonly code: string;
  public readonly recoverable: boolean;
  public override readonly cause?: Error | undefined;

  constructor(
    message: string,
    code: string,
    recoverable: boolean,
    cause?: Error
  ) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
    this.recoverable = recoverable;
    this.cause = cause;
  }
}
