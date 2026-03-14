/**
 * Message service: validates and persists new messages in a thread.
 * Implements FR-008, FR-009 (send and validate messages).
 */
import type { Database } from "bun:sqlite";
import { randomUUID } from "crypto";
import {
  getThreadById,
  insertMessage,
  getMessagesByThread,
  getNextSequenceNumber,
  updateThreadTimestamps,
  threadToSummary,
  messageToView,
} from "../database/workspace-repository.js";
import { MESSAGE_ROLES } from "../../shared/models/workspace.js";
import type { MessageRole } from "../../shared/models/workspace.js";
import type {
  ActiveThreadDetail,
  IpcResult,
  IpcError,
} from "../../shared/contracts/workspace.js";
import { DatabaseError, toDatabaseError } from "../database/sqlite.js";

export interface SendMessageInput {
  threadId: string;
  content: string;
  role: string;
}

function toIpcError(error: unknown): IpcError {
  if (error instanceof DatabaseError) {
    return {
      code: error.code,
      message: error.message,
      recoverable: error.recoverable,
    };
  }

  const message =
    error instanceof Error ? error.message : "Unable to save the message.";

  if (typeof message === "string" && message.startsWith("Thread not found: ")) {
    return {
      code: "THREAD_NOT_FOUND",
      message,
      recoverable: true,
    };
  }

  const dbError = toDatabaseError(error, "Unable to save the message.");

  return {
    code: dbError.code,
    message: dbError.message,
    recoverable: dbError.recoverable,
  };
}

/**
 * Validates and persists a new message in the given thread.
 * Returns the refreshed ActiveThreadDetail on success.
 */
export function sendMessage(
  db: Database,
  input: SendMessageInput
): IpcResult<ActiveThreadDetail> {
  if (!input.threadId || input.threadId.trim() === "") {
    return {
      success: false,
      error: {
        code: "THREAD_ID_REQUIRED",
        message: "Thread ID is required.",
        recoverable: true,
      },
    };
  }

  const trimmedContent = input.content.trim();
  if (trimmedContent === "") {
    return {
      success: false,
      error: {
        code: "CONTENT_EMPTY",
        message: "Message content cannot be empty or whitespace only.",
        recoverable: true,
      },
    };
  }

  const role: MessageRole = MESSAGE_ROLES.has(input.role as MessageRole)
    ? (input.role as MessageRole)
    : "user";

  try {
    db.exec("BEGIN IMMEDIATE TRANSACTION");

    const thread = getThreadById(db, input.threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${input.threadId}`);
    }

    const now = new Date().toISOString();
    const sequenceNumber = getNextSequenceNumber(db, input.threadId);

    const message = {
      id: randomUUID(),
      threadId: input.threadId,
      role,
      content: trimmedContent,
      sequenceNumber,
      createdAt: now,
    };

    insertMessage(db, message);
    updateThreadTimestamps(db, input.threadId, now, now);

    const updatedThread = getThreadById(db, input.threadId);
    if (!updatedThread) {
      throw new Error("Failed to reload thread after sending message.");
    }

    const messages = getMessagesByThread(db, input.threadId);
    db.exec("COMMIT");

    return {
      success: true,
      data: {
        thread: threadToSummary(updatedThread),
        messages: messages.map(messageToView),
      },
    };
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Ignore rollback failures; the original error is the actionable one.
    }

    return {
      success: false,
      error: toIpcError(error),
    };
  }
}
