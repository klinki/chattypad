/**
 * Workspace service: orchestrates loading the workspace snapshot and opening threads.
 * Keeps IPC handlers thin by centralizing data mapping and error handling here.
 */
import type { Database } from "bun:sqlite";
import {
  getAllProjects,
  getAllThreadsByProject,
  getThreadById,
  getMessagesByThread,
  projectToSummary,
  threadToSummary,
  messageToView,
} from "../database/workspace-repository.js";
import type {
  WorkspaceSnapshot,
  ActiveThreadDetail,
  IpcResult,
} from "../../shared/contracts/workspace.js";
import { withIpcError } from "./ipc-error.js";

function getInitialActiveThreadId(db: Database, projectIds: string[]): string | null {
  for (const projectId of projectIds) {
    const firstThread = getAllThreadsByProject(db, projectId)[0];
    if (firstThread) {
      return firstThread.id;
    }
  }

  return null;
}

/**
 * Loads the full workspace snapshot for the sidebar.
 * FR-002, FR-012: Returns all projects and their threads; empty collections if none exist.
 */
export function loadWorkspace(db: Database): IpcResult<WorkspaceSnapshot> {
  return withIpcError(() => {
    const projects = getAllProjects(db);
    const threadsByProject: Record<string, ReturnType<typeof threadToSummary>[]> = {};

    for (const project of projects) {
      const threads = getAllThreadsByProject(db, project.id);
      threadsByProject[project.id] = threads.map(threadToSummary);
    }

    return {
      projects: projects.map(projectToSummary),
      threadsByProject,
      activeThreadId: getInitialActiveThreadId(
        db,
        projects.map((project) => project.id)
      ),
    };
  }, {
    fallbackCode: "WORKSPACE_LOAD_FAILED",
    fallbackMessage: "Workspace data is currently unavailable.",
  });
}

/**
 * Opens a thread and returns its metadata and ordered messages.
 * FR-004, FR-006: Returns messages in chronological order.
 */
export function openThread(
  db: Database,
  threadId: string
): IpcResult<ActiveThreadDetail> {
  if (!threadId || threadId.trim() === "") {
    return {
      success: false,
      error: {
        code: "THREAD_ID_REQUIRED",
        message: "Thread ID is required.",
        recoverable: true,
      },
    };
  }

  return withIpcError(() => {
    const thread = getThreadById(db, threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    const messages = getMessagesByThread(db, threadId);
    return {
      thread: threadToSummary(thread),
      messages: messages.map(messageToView),
    };
  }, {
    fallbackCode: "THREAD_OPEN_FAILED",
    fallbackMessage: "Workspace data is currently unavailable.",
  });
}
