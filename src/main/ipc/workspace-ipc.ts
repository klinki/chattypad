/**
 * IPC handler registration for the workspace feature.
 * Maps Electrobun IPC channels to workspace service calls.
 * The handler functions are exported for direct testing without the Electrobun bridge.
 *
 * Channels:
 *   workspace:load  → loadWorkspace
 *   project:create  → createProject
 *   project:delete  → removeProject
 *   thread:create   → createThread
 *   thread:open     → openThread
 *   message:send    → sendMessage (wired in Phase 5 via message-service)
 */
import type { Database } from "bun:sqlite";
import {
  createProject,
  createThread,
  loadWorkspace,
  openThread,
  removeProject,
  updateProject,
  createProjectGroup,
  removeProjectGroup,
  renameProjectGroup,
  moveProjectToGroup,
  reorderProject,
  reorderThread,
  updateThread,
  unlockProject,
  lockProject,
  lockAllProjects,
} from "../app/workspace-service.js";
import { sendMessage } from "../app/message-service.js";
import type {
  WorkspaceSnapshot,
  ActiveThreadDetail,
  IpcResult,
  ProjectCreateRequest,
  ProjectDeleteRequest,
  ProjectUpdateRequest,
  ProjectGroupCreateRequest,
  ProjectGroupDeleteRequest,
  ProjectGroupUpdateRequest,
  ProjectMoveToGroupRequest,
  ProjectUnlockRequest,
  ProjectLockRequest,
  ReorderRequest,
  ThreadUpdateRequest,
  ThreadCreateRequest,
} from "../../shared/contracts/workspace.js";
import { IPC_CHANNELS as CHANNELS } from "../../shared/contracts/workspace.js";
import type {
  MessageSendRequest,
  ThreadOpenRequest,
} from "../../shared/contracts/electrobun-rpc.js";

const debugIpcEnabled = process.env["CHATTYPAD_DEBUG"] === "1";

export interface WorkspaceHandlers {
    handleWorkspaceLoad: () => Promise<IpcResult<WorkspaceSnapshot>>;
  handleProjectCreate: (name: string, isEncrypted?: boolean, password?: string) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleProjectDelete: (projectId: string) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleProjectUpdate: (projectId: string, name?: string, isCollapsed?: boolean) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleProjectGroupCreate: (name: string) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleProjectGroupDelete: (groupId: string) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleProjectGroupUpdate: (groupId: string, name: string) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleProjectMoveToGroup: (projectId: string, groupId: string | null) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleProjectReorder: (projectId: string, targetSortOrder: number) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleThreadCreate: (projectId: string) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleThreadUpdate: (threadId: string, title: string) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleThreadReorder: (threadId: string, targetSortOrder: number) => Promise<IpcResult<WorkspaceSnapshot>>;
  handleThreadOpen: (threadId: string) => Promise<IpcResult<ActiveThreadDetail>>;
  handleProjectUnlock: (projectId: string, password: string) => Promise<IpcResult<void>>;
  handleProjectLock: (projectId: string) => IpcResult<void>;
  handleProjectLockAll: () => IpcResult<void>;
  handleMessageSend: (
    threadId: string,
    content: string,
    role: string
  ) => Promise<IpcResult<ActiveThreadDetail>>;
}

export interface WorkspaceRpcRequestHandlers {
    [CHANNELS.WORKSPACE_LOAD]: () => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.PROJECT_CREATE]: (payload?: ProjectCreateRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.PROJECT_DELETE]: (payload?: ProjectDeleteRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.PROJECT_UPDATE]: (payload?: ProjectUpdateRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.PROJECT_GROUP_CREATE]: (payload?: ProjectGroupCreateRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.PROJECT_GROUP_DELETE]: (payload?: ProjectGroupDeleteRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.PROJECT_GROUP_UPDATE]: (payload?: ProjectGroupUpdateRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.PROJECT_MOVE_TO_GROUP]: (payload?: ProjectMoveToGroupRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.PROJECT_REORDER]: (payload?: ReorderRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.THREAD_CREATE]: (payload?: ThreadCreateRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.THREAD_UPDATE]: (payload?: ThreadUpdateRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.THREAD_REORDER]: (payload?: ReorderRequest) => Promise<IpcResult<WorkspaceSnapshot>>;
  [CHANNELS.THREAD_OPEN]: (
    payload?: ThreadOpenRequest
  ) => Promise<IpcResult<ActiveThreadDetail>>;
  [CHANNELS.MESSAGE_SEND]: (
    payload?: MessageSendRequest
  ) => Promise<IpcResult<ActiveThreadDetail>>;
  [CHANNELS.PROJECT_UNLOCK]: (payload?: ProjectUnlockRequest) => Promise<IpcResult<void>>;
  [CHANNELS.PROJECT_LOCK]: (payload?: ProjectLockRequest) => Promise<IpcResult<void>>;
  [CHANNELS.PROJECT_LOCK_ALL]: () => IpcResult<void>;
}

/**
 * Creates the IPC handler objects bound to the provided database connection.
 * Exported separately so tests can invoke handlers directly.
 */
export function createWorkspaceHandlers(db: Database): WorkspaceHandlers {
    return {
    handleWorkspaceLoad: () => loadWorkspace(db),
    handleProjectCreate: (name: string, isEncrypted?: boolean, password?: string) => createProject(db, name, isEncrypted, password),
    handleProjectDelete: (projectId: string) => removeProject(db, projectId),
    handleProjectUpdate: (projectId: string, name?: string, isCollapsed?: boolean) => {
      const updates: { name?: string; isCollapsed?: boolean } = {};
      if (name !== undefined) updates.name = name;
      if (isCollapsed !== undefined) updates.isCollapsed = isCollapsed;
      return updateProject(db, projectId, updates);
    },
    handleProjectGroupCreate: (name: string) => createProjectGroup(db, name),
    handleProjectGroupDelete: (groupId: string) => removeProjectGroup(db, groupId),
    handleProjectGroupUpdate: (groupId: string, name: string) => renameProjectGroup(db, groupId, name),
    handleProjectMoveToGroup: (projectId: string, groupId: string | null) => moveProjectToGroup(db, projectId, groupId),
    handleProjectReorder: (projectId: string, targetSortOrder: number) => reorderProject(db, projectId, targetSortOrder),
    handleThreadCreate: (projectId: string) => createThread(db, projectId),
    handleThreadUpdate: (threadId: string, title: string) => updateThread(db, threadId, title),
    handleThreadReorder: (threadId: string, targetSortOrder: number) => reorderThread(db, threadId, targetSortOrder),
    handleThreadOpen: (threadId: string) => openThread(db, threadId),
    handleProjectUnlock: (projectId: string, password: string) => unlockProject(db, projectId, password),
    handleProjectLock: (projectId: string) => lockProject(db, projectId),
    handleProjectLockAll: () => lockAllProjects(db),
    handleMessageSend: (threadId: string, content: string, role: string) =>
      sendMessage(db, { threadId, content, role }),
  };
}


function normalizeProjectUpdateRequest(payload?: any): any {
  const result: any = {
    projectId: typeof payload?.projectId === "string" ? payload.projectId : "",
  };
  if (typeof payload?.name === "string") result.name = payload.name;
  if (typeof payload?.isCollapsed === "boolean") result.isCollapsed = payload.isCollapsed;
  return result;
}
function normalizeProjectGroupCreateRequest(payload?: any): any {
  return { name: typeof payload?.name === "string" ? payload.name : "" };
}
function normalizeProjectGroupDeleteRequest(payload?: any): any {
  return { groupId: typeof payload?.groupId === "string" ? payload.groupId : "" };
}
function normalizeProjectGroupUpdateRequest(payload?: any): any {
  return {
    groupId: typeof payload?.groupId === "string" ? payload.groupId : "",
    name: typeof payload?.name === "string" ? payload.name : "",
  };
}
function normalizeProjectMoveToGroupRequest(payload?: any): any {
  return {
    projectId: typeof payload?.projectId === "string" ? payload.projectId : "",
    groupId: typeof payload?.groupId === "string" ? payload.groupId : null,
  };
}
function normalizeReorderRequest(payload?: any): any {
  return {
    itemId: typeof payload?.itemId === "string" ? payload.itemId : "",
    targetSortOrder: typeof payload?.targetSortOrder === "number" ? payload.targetSortOrder : 0,
  };
}
function normalizeThreadUpdateRequest(payload?: any): any {
  return {
    threadId: typeof payload?.threadId === "string" ? payload.threadId : "",
    title: typeof payload?.title === "string" ? payload.title : "",
  };
}

function normalizeProjectCreateRequest(
  payload?: ProjectCreateRequest
): ProjectCreateRequest {
  const request: ProjectCreateRequest = {
    name: typeof payload?.name === "string" ? payload.name : "",
    isEncrypted: typeof payload?.isEncrypted === "boolean" ? payload.isEncrypted : false,
  };
  
  if (typeof payload?.password === "string") {
    request.password = payload.password;
  }

  return request;
}

function normalizeProjectDeleteRequest(
  payload?: ProjectDeleteRequest
): ProjectDeleteRequest {
  return {
    projectId: typeof payload?.projectId === "string" ? payload.projectId : "",
  };
}

function normalizeThreadOpenRequest(payload?: ThreadOpenRequest): ThreadOpenRequest {
  return {
    threadId: typeof payload?.threadId === "string" ? payload.threadId : "",
  };
}

function normalizeThreadCreateRequest(
  payload?: ThreadCreateRequest
): ThreadCreateRequest {
  return {
    projectId: typeof payload?.projectId === "string" ? payload.projectId : "",
  };
}

/**
 * Builds the Electrobun request handler map from the plain workspace handlers.
 */
export function createWorkspaceRpcRequestHandlers(
  db: Database
): WorkspaceRpcRequestHandlers {
  const handlers = createWorkspaceHandlers(db);

  function logRequest(channel: string, detail?: string): void {
    if (!debugIpcEnabled) {
      return;
    }

    console.log(`[ipc] ${channel}${detail ? ` ${detail}` : ""}`);
  }

  return {
    [CHANNELS.WORKSPACE_LOAD]: async () => {
      logRequest(CHANNELS.WORKSPACE_LOAD, "request");
      const result = await handlers.handleWorkspaceLoad();
      logRequest(
        CHANNELS.WORKSPACE_LOAD,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
    [CHANNELS.PROJECT_CREATE]: async (payload) => {
      const request = normalizeProjectCreateRequest(payload);
      logRequest(CHANNELS.PROJECT_CREATE, `request name=${request.name}`);
      const result = await handlers.handleProjectCreate(request.name, request.isEncrypted, request.password);
      logRequest(
        CHANNELS.PROJECT_CREATE,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
    [CHANNELS.PROJECT_DELETE]: async (payload) => {
      const request = normalizeProjectDeleteRequest(payload);
      logRequest(
        CHANNELS.PROJECT_DELETE,
        `request projectId=${request.projectId}`
      );
      const result = await handlers.handleProjectDelete(request.projectId);
      logRequest(
        CHANNELS.PROJECT_DELETE,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
    [CHANNELS.PROJECT_UPDATE]: async (payload) => {
      const request = normalizeProjectUpdateRequest(payload);
      logRequest(CHANNELS.PROJECT_UPDATE, `request projectId=${request.projectId}`);
      const result = await handlers.handleProjectUpdate(request.projectId, request.name, request.isCollapsed);
      logRequest(CHANNELS.PROJECT_UPDATE, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_GROUP_CREATE]: async (payload) => {
      const request = normalizeProjectGroupCreateRequest(payload);
      logRequest(CHANNELS.PROJECT_GROUP_CREATE, `request name=${request.name}`);
      const result = await handlers.handleProjectGroupCreate(request.name);
      logRequest(CHANNELS.PROJECT_GROUP_CREATE, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_GROUP_DELETE]: async (payload) => {
      const request = normalizeProjectGroupDeleteRequest(payload);
      logRequest(CHANNELS.PROJECT_GROUP_DELETE, `request groupId=${request.groupId}`);
      const result = await handlers.handleProjectGroupDelete(request.groupId);
      logRequest(CHANNELS.PROJECT_GROUP_DELETE, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_GROUP_UPDATE]: async (payload) => {
      const request = normalizeProjectGroupUpdateRequest(payload);
      logRequest(CHANNELS.PROJECT_GROUP_UPDATE, `request groupId=${request.groupId}`);
      const result = await handlers.handleProjectGroupUpdate(request.groupId, request.name);
      logRequest(CHANNELS.PROJECT_GROUP_UPDATE, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_MOVE_TO_GROUP]: async (payload) => {
      const request = normalizeProjectMoveToGroupRequest(payload);
      logRequest(CHANNELS.PROJECT_MOVE_TO_GROUP, `request projectId=${request.projectId}`);
      const result = await handlers.handleProjectMoveToGroup(request.projectId, request.groupId);
      logRequest(CHANNELS.PROJECT_MOVE_TO_GROUP, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_REORDER]: async (payload) => {
      const request = normalizeReorderRequest(payload);
      logRequest(CHANNELS.PROJECT_REORDER, `request itemId=${request.itemId}`);
      const result = await handlers.handleProjectReorder(request.itemId, request.targetSortOrder);
      logRequest(CHANNELS.PROJECT_REORDER, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.THREAD_UPDATE]: async (payload) => {
      const request = normalizeThreadUpdateRequest(payload);
      logRequest(CHANNELS.THREAD_UPDATE, `request threadId=${request.threadId}`);
      const result = await handlers.handleThreadUpdate(request.threadId, request.title);
      logRequest(CHANNELS.THREAD_UPDATE, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.THREAD_REORDER]: async (payload) => {
      const request = normalizeReorderRequest(payload);
      logRequest(CHANNELS.THREAD_REORDER, `request itemId=${request.itemId}`);
      const result = await handlers.handleThreadReorder(request.itemId, request.targetSortOrder);
      logRequest(CHANNELS.THREAD_REORDER, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.THREAD_CREATE]: async (payload) => {
      const request = normalizeThreadCreateRequest(payload);
      logRequest(CHANNELS.THREAD_CREATE, `request projectId=${request.projectId}`);
      const result = await handlers.handleThreadCreate(request.projectId);
      logRequest(
        CHANNELS.THREAD_CREATE,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
    [CHANNELS.THREAD_OPEN]: async (payload) => {
      const request = normalizeThreadOpenRequest(payload);
      logRequest(CHANNELS.THREAD_OPEN, `request threadId=${request.threadId}`);
      const result = await handlers.handleThreadOpen(request.threadId);
      logRequest(
        CHANNELS.THREAD_OPEN,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
    [CHANNELS.PROJECT_UNLOCK]: async (payload?: ProjectUnlockRequest) => {
      logRequest(CHANNELS.PROJECT_UNLOCK, `request projectId=${payload?.projectId}`);
      const result = await handlers.handleProjectUnlock(payload?.projectId ?? "", payload?.password ?? "");
      logRequest(CHANNELS.PROJECT_UNLOCK, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_LOCK]: async (payload?: ProjectLockRequest) => {
      logRequest(CHANNELS.PROJECT_LOCK, `request projectId=${payload?.projectId}`);
      const result = await handlers.handleProjectLock(payload?.projectId ?? "");
      logRequest(CHANNELS.PROJECT_LOCK, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },

    [CHANNELS.PROJECT_LOCK_ALL]: () => {
      logRequest(CHANNELS.PROJECT_LOCK_ALL, "request");
      const result = handlers.handleProjectLockAll();
      logRequest(CHANNELS.PROJECT_LOCK_ALL, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.MESSAGE_SEND]: async (payload) => {
      const request = {
        threadId: typeof payload?.threadId === "string" ? payload.threadId : "",
        content: typeof payload?.content === "string" ? payload.content : "",
        role: typeof payload?.role === "string" ? payload.role : "user",
      };

      logRequest(CHANNELS.MESSAGE_SEND, `request threadId=${request.threadId}`);
      const result = await handlers.handleMessageSend(
        request.threadId,
        request.content,
        request.role
      );
      logRequest(
        CHANNELS.MESSAGE_SEND,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
  };
}
