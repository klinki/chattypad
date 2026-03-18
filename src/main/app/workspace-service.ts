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
  getAllProjectGroups,
  projectGroupToSummary,
  insertProjectGroup,
  getNextProjectGroupSortOrder,
  deleteProjectGroup,
  updateProjectGroup,
  updateProject as updateProjectRepo,
  updateProjectSortOrder,
  updateThreadSortOrder,
  updateThreadTitle,
} from "../database/workspace-repository.js";
import type { ChatThread, Project, ProjectGroup } from "../../shared/models/workspace.js";
import type {
  WorkspaceSnapshot,
  ActiveThreadDetail,
  IpcResult,
} from "../../shared/contracts/workspace.js";
import { withIpcError } from "./ipc-error.js";
import { CryptoService } from "../../shared/crypto/crypto-service.js";

export const sessionKeys = new Map<string, CryptoKey>();

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
  const projectGroups = getAllProjectGroups(db);
  const projects = getAllProjects(db);
  const threadsByProject: Record<string, ReturnType<typeof threadToSummary>[]> = {};

  for (const project of projects) {
    const threads = getAllThreadsByProject(db, project.id);
    threadsByProject[project.id] = threads.map(threadToSummary);
  }

  return {
    projectGroups: projectGroups.map(projectGroupToSummary),
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

export async function createProject(
  db: Database,
  name: string,
  isEncrypted: boolean = false,
  password?: string
): Promise<IpcResult<WorkspaceSnapshot>> {
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

  if (isEncrypted && !password) {
    return {
      success: false,
      error: {
        code: "PASSWORD_REQUIRED",
        message: "Password is required for encrypted projects.",
        recoverable: true,
      },
    };
  }

  return withIpcError(async () => {
    const now = new Date().toISOString();
    let passwordHash: string | null = null;
    let encryptionSalt: string | null = null;

    if (isEncrypted && password) {
      // @ts-ignore - Bun.password is available in Bun environment
      passwordHash = await Bun.password.hash(password);
      // We use a separate salt for PBKDF2 key derivation (handled in CryptoService)
      const salt = crypto.getRandomValues(new Uint8Array(16));
      encryptionSalt = btoa(String.fromCharCode(...salt));
    }

    const project: Project = {
      id: crypto.randomUUID(),
      name: trimmedName,
      sortOrder: getNextProjectSortOrder(db),
      groupId: null,
      isCollapsed: false,
      isEncrypted,
      passwordHash,
      encryptionSalt,
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

export async function createThread(
  db: Database,
  projectId: string
): Promise<IpcResult<WorkspaceSnapshot>> {
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

  return withIpcError(async () => {
    const now = new Date().toISOString();
    let title = "New thread";
    
    if (existingProject.isEncrypted) {
      const key = sessionKeys.get(projectId);
      if (!key) {
        throw new Error("Project is locked.");
      }
      title = await CryptoService.encrypt(title, key);
    }

    const thread: ChatThread = {
      id: crypto.randomUUID(),
      projectId,
      title,
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

  return withIpcError(async () => {
    const thread = getThreadById(db, threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    const project = getProjectById(db, thread.projectId);
    const key = sessionKeys.get(thread.projectId);

    const messages = getMessagesByThread(db, threadId);
    
    let threadTitle = thread.title;
    if (project?.isEncrypted && key) {
      try {
        threadTitle = await CryptoService.decrypt(thread.title, key);
      } catch (err) {
        console.error("Failed to decrypt thread title", err);
        threadTitle = "[Encrypted Content]";
      }
    }

    const messageViews = await Promise.all(messages.map(async (m) => {
      let content = m.content;
      if (project?.isEncrypted && key) {
        try {
          content = await CryptoService.decrypt(m.content, key);
        } catch (err) {
          console.error("Failed to decrypt message content", err);
          content = "[Encrypted Content]";
        }
      }
      return {
        ...messageToView(m),
        content,
      };
    }));

    return {
      thread: {
        ...threadToSummary(thread),
        title: threadTitle,
      },
      messages: messageViews,
    };
  }, {
    fallbackCode: "THREAD_OPEN_FAILED",
    fallbackMessage: "Workspace data is currently unavailable.",
  });
}

export function updateProject(
  db: Database,
  projectId: string,
  updates: { name?: string; isCollapsed?: boolean }
): IpcResult<WorkspaceSnapshot> {
  return withIpcError(() => {
    updateProjectRepo(db, projectId, updates);
    return buildWorkspaceSnapshot(db);
  }, {
    fallbackCode: "PROJECT_UPDATE_FAILED",
    fallbackMessage: "The project could not be updated.",
  });
}

export function createProjectGroup(
  db: Database,
  name: string
): IpcResult<WorkspaceSnapshot> {
  return withIpcError(() => {
    const group: ProjectGroup = {
      id: crypto.randomUUID(),
      name,
      sortOrder: getNextProjectGroupSortOrder(db),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    insertProjectGroup(db, group);
    return buildWorkspaceSnapshot(db);
  }, {
    fallbackCode: "PROJECT_GROUP_CREATE_FAILED",
    fallbackMessage: "The project group could not be created.",
  });
}

export function removeProjectGroup(
  db: Database,
  groupId: string
): IpcResult<WorkspaceSnapshot> {
  return withIpcError(() => {
    deleteProjectGroup(db, groupId);
    return buildWorkspaceSnapshot(db);
  }, {
    fallbackCode: "PROJECT_GROUP_DELETE_FAILED",
    fallbackMessage: "The project group could not be deleted.",
  });
}

export function renameProjectGroup(
  db: Database,
  groupId: string,
  name: string
): IpcResult<WorkspaceSnapshot> {
  return withIpcError(() => {
    updateProjectGroup(db, groupId, name);
    return buildWorkspaceSnapshot(db);
  }, {
    fallbackCode: "PROJECT_GROUP_UPDATE_FAILED",
    fallbackMessage: "The project group could not be updated.",
  });
}

export function moveProjectToGroup(
  db: Database,
  projectId: string,
  groupId: string | null
): IpcResult<WorkspaceSnapshot> {
  return withIpcError(() => {
    updateProjectRepo(db, projectId, { groupId });
    return buildWorkspaceSnapshot(db);
  }, {
    fallbackCode: "PROJECT_MOVE_FAILED",
    fallbackMessage: "The project could not be moved.",
  });
}

export function reorderProject(
  db: Database,
  projectId: string,
  targetSortOrder: number
): IpcResult<WorkspaceSnapshot> {
  return withIpcError(() => {
    updateProjectSortOrder(db, projectId, targetSortOrder);
    return buildWorkspaceSnapshot(db);
  }, {
    fallbackCode: "PROJECT_REORDER_FAILED",
    fallbackMessage: "The project could not be reordered.",
  });
}

export function reorderThread(
  db: Database,
  threadId: string,
  targetSortOrder: number
): IpcResult<WorkspaceSnapshot> {
  return withIpcError(() => {
    updateThreadSortOrder(db, threadId, targetSortOrder);
    return buildWorkspaceSnapshot(db);
  }, {
    fallbackCode: "THREAD_REORDER_FAILED",
    fallbackMessage: "The thread could not be reordered.",
  });
}

export async function unlockProject(
  db: Database,
  projectId: string,
  password: string
): Promise<IpcResult<void>> {
  return withIpcError(async () => {
    const project = getProjectById(db, projectId);
    if (!project || !project.isEncrypted || !project.passwordHash) {
      return {
        success: false,
        error: {
          code: "PROJECT_NOT_ENCRYPTED",
          message: "The project is not encrypted.",
          recoverable: true,
        },
      };
    }

    // @ts-ignore - Bun.password is available
    const isMatch = await Bun.password.verify(password, project.passwordHash);
    if (!isMatch) {
      return {
        success: false,
        error: {
          code: "INVALID_PASSWORD",
          message: "Incorrect password.",
          recoverable: true,
        },
      };
    }

    if (project.encryptionSalt) {
      const salt = CryptoService.base64ToUint8Array(project.encryptionSalt);
      const key = await CryptoService.deriveKey(password, salt);
      sessionKeys.set(projectId, key);
    }

    return { success: true, data: undefined };
  }, {
    fallbackCode: "PROJECT_UNLOCK_FAILED",
    fallbackMessage: "Failed to unlock project.",
  });
}

export function lockProject(
  _db: Database,
  projectId: string
): IpcResult<void> {
  sessionKeys.delete(projectId);
  return { success: true, data: undefined };
}

export function lockAllProjects(
  _db: Database
): IpcResult<void> {
  sessionKeys.clear();
  return { success: true, data: undefined };
}
