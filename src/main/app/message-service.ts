/**
 * Message service: validates and persists new messages in a thread.
 * Implements FR-008, FR-009 (send and validate messages).
 */
import type { Database } from "bun:sqlite";
import { randomUUID } from "crypto";
import {
  getThreadById,
  getProjectById,
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
import { sessionKeys } from "./workspace-service.js";
import { CryptoService } from "../../shared/crypto/crypto-service.js";

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
export async function sendMessage(
  db: Database,
  input: SendMessageInput
): Promise<IpcResult<ActiveThreadDetail>> {
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
    const thread = getThreadById(db, input.threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${input.threadId}`);
    }

    const project = getProjectById(db, thread.projectId);
    const key = sessionKeys.get(thread.projectId);

    let contentToStore = trimmedContent;
    if (project?.isEncrypted) {
      if (!key) {
        return {
          success: false,
          error: {
            code: "PROJECT_LOCKED",
            message: "The project is locked. Please unlock it to send messages.",
            recoverable: true,
          },
        };
      }
      contentToStore = await CryptoService.encrypt(trimmedContent, key);
    }

    db.exec("BEGIN IMMEDIATE TRANSACTION");

    const now = new Date().toISOString();
    const sequenceNumber = getNextSequenceNumber(db, input.threadId);

    const message = {
      id: randomUUID(),
      threadId: input.threadId,
      role,
      content: contentToStore,
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

    // Decrypt messages for view
    const messageViews = await Promise.all(messages.map(async (m) => {
      let content = m.content;
      if (project?.isEncrypted && key) {
        try {
          content = await CryptoService.decrypt(m.content, key);
        } catch (err) {
          content = "[Encrypted Content]";
        }
      }
      return {
        ...messageToView(m),
        content,
      };
    }));

    let threadTitle = updatedThread.title;
    if (project?.isEncrypted && key) {
      try {
        threadTitle = await CryptoService.decrypt(updatedThread.title, key);
      } catch (err) {
        threadTitle = "[Encrypted Content]";
      }
    }

    return {
      success: true,
      data: {
        thread: {
          ...threadToSummary(updatedThread),
          title: threadTitle,
        },
        messages: messageViews,
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
