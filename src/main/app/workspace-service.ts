/**
 * Workspace service: orchestrates loading the workspace snapshot and opening threads.
 * Keeps IPC handlers thin by centralizing data mapping and error handling here.
 */
import type { Database } from "bun:sqlite";
import {
  deleteProject,
  getAllProjects,
  getAllThreadsByProject,
  getNextThreadSortOrder,
  getProjectById,
  getNextProjectSortOrder,
  getThreadById,
  getMessagesByThread,
  insertProject,
  insertThread,
  projectToSummary,
  threadToSummary,
  messageToView,
} from "../database/workspace-repository.js";
import type { ChatThread, Project } from "../../shared/models/workspace.js";
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

function buildWorkspaceSnapshot(db: Database): WorkspaceSnapshot {
  return buildWorkspaceSnapshotWithActiveThread(db);
}

function buildWorkspaceSnapshotWithActiveThread(
  db: Database,
  activeThreadId?: string | null
): WorkspaceSnapshot {
  const projects = getAllProjects(db);
  const threadsByProject: Record<string, ReturnType<typeof threadToSummary>[]> = {};

  for (const project of projects) {
    const threads = getAllThreadsByProject(db, project.id);
    threadsByProject[project.id] = threads.map(threadToSummary);
  }

  return {
    projects: projects.map(projectToSummary),
    threadsByProject,
    activeThreadId:
      activeThreadId !== undefined
        ? activeThreadId
        : getInitialActiveThreadId(
            db,
            projects.map((project) => project.id)
          ),
  };
}

/**
 * Loads the full workspace snapshot for the sidebar.
 * FR-002, FR-012: Returns all projects and their threads; empty collections if none exist.
 */
export function loadWorkspace(db: Database): IpcResult<WorkspaceSnapshot> {
  return withIpcError(() => {
    return buildWorkspaceSnapshot(db);
  }, {
    fallbackCode: "WORKSPACE_LOAD_FAILED",
    fallbackMessage: "Workspace data is currently unavailable.",
  });
}

export function createProject(
  db: Database,
  name: string
): IpcResult<WorkspaceSnapshot> {
  const trimmedName = name.trim();
  if (trimmedName === "") {
    return {
      success: false,
      error: {
        code: "PROJECT_NAME_REQUIRED",
        message: "Project name is required.",
        recoverable: true,
      },
    };
  }

  return withIpcError(() => {
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      name: trimmedName,
      sortOrder: getNextProjectSortOrder(db),
      createdAt: now,
      updatedAt: now,
    };

    insertProject(db, project);
    return buildWorkspaceSnapshot(db);
  }, {
    fallbackCode: "PROJECT_CREATE_FAILED",
    fallbackMessage: "The project could not be created.",
  });
}

export function removeProject(
  db: Database,
  projectId: string
): IpcResult<WorkspaceSnapshot> {
  if (!projectId || projectId.trim() === "") {
    return {
      success: false,
      error: {
        code: "PROJECT_ID_REQUIRED",
        message: "Project ID is required.",
        recoverable: true,
      },
    };
  }

  const existingProject = getProjectById(db, projectId);
  if (!existingProject) {
    return {
      success: false,
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
        recoverable: true,
      },
    };
  }

  return withIpcError(() => {
    deleteProject(db, projectId);
    return buildWorkspaceSnapshot(db);
  }, {
    fallbackCode: "PROJECT_DELETE_FAILED",
    fallbackMessage: "The project could not be deleted.",
  });
}

export function createThread(
  db: Database,
  projectId: string
): IpcResult<WorkspaceSnapshot> {
  if (!projectId || projectId.trim() === "") {
    return {
      success: false,
      error: {
        code: "PROJECT_ID_REQUIRED",
        message: "Project ID is required.",
        recoverable: true,
      },
    };
  }

  const existingProject = getProjectById(db, projectId);
  if (!existingProject) {
    return {
      success: false,
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
        recoverable: true,
      },
    };
  }

  return withIpcError(() => {
    const now = new Date().toISOString();
    const thread: ChatThread = {
      id: crypto.randomUUID(),
      projectId,
      title: "New thread",
      sortOrder: getNextThreadSortOrder(db, projectId),
      createdAt: now,
      updatedAt: now,
      lastMessageAt: null,
    };

    insertThread(db, thread);
    return buildWorkspaceSnapshotWithActiveThread(db, thread.id);
  }, {
    fallbackCode: "THREAD_CREATE_FAILED",
    fallbackMessage: "The thread could not be created.",
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
