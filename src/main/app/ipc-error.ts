import type { IpcError, IpcResult } from "../../shared/contracts/workspace.js";
import { DatabaseError, toDatabaseError } from "../database/sqlite.js";

interface IpcErrorOptions {
  fallbackCode: string;
  fallbackMessage: string;
}

export function toIpcError(error: unknown, options: IpcErrorOptions): IpcError {
  if (error instanceof DatabaseError) {
    return {
      code: error.code,
      message: error.message,
      recoverable: error.recoverable,
    };
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  if (typeof message === "string" && message.startsWith("Thread not found: ")) {
    return {
      code: "THREAD_NOT_FOUND",
      message,
      recoverable: true,
    };
  }

  const dbError = toDatabaseError(error, options.fallbackMessage);
  return {
    code: dbError.code || options.fallbackCode,
    message: dbError.message,
    recoverable: dbError.recoverable,
  };
}

export function withIpcError<T>(
  fn: () => T,
  options: IpcErrorOptions
): IpcResult<T> {
  try {
    return { success: true, data: fn() };
  } catch (error) {
    return {
      success: false,
      error: toIpcError(error, options),
    };
  }
}
