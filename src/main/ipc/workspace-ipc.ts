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
    handleWorkspaceLoad: () => IpcResult<WorkspaceSnapshot>;
  handleProjectCreate: (name: string) => IpcResult<WorkspaceSnapshot>;
  handleProjectDelete: (projectId: string) => IpcResult<WorkspaceSnapshot>;
  handleProjectUpdate: (projectId: string, name?: string, isCollapsed?: boolean) => IpcResult<WorkspaceSnapshot>;
  handleProjectGroupCreate: (name: string) => IpcResult<WorkspaceSnapshot>;
  handleProjectGroupDelete: (groupId: string) => IpcResult<WorkspaceSnapshot>;
  handleProjectGroupUpdate: (groupId: string, name: string) => IpcResult<WorkspaceSnapshot>;
  handleProjectMoveToGroup: (projectId: string, groupId: string | null) => IpcResult<WorkspaceSnapshot>;
  handleProjectReorder: (projectId: string, targetSortOrder: number) => IpcResult<WorkspaceSnapshot>;
  handleThreadCreate: (projectId: string) => IpcResult<WorkspaceSnapshot>;
  handleThreadUpdate: (threadId: string, title: string) => IpcResult<WorkspaceSnapshot>;
  handleThreadReorder: (threadId: string, targetSortOrder: number) => IpcResult<WorkspaceSnapshot>;
  handleThreadOpen: (threadId: string) => IpcResult<ActiveThreadDetail>;
  handleMessageSend: (
    threadId: string,
    content: string,
    role: string
  ) => IpcResult<ActiveThreadDetail>;
}

export interface WorkspaceRpcRequestHandlers {
    [CHANNELS.WORKSPACE_LOAD]: () => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.PROJECT_CREATE]: (payload?: ProjectCreateRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.PROJECT_DELETE]: (payload?: ProjectDeleteRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.PROJECT_UPDATE]: (payload?: ProjectUpdateRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.PROJECT_GROUP_CREATE]: (payload?: ProjectGroupCreateRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.PROJECT_GROUP_DELETE]: (payload?: ProjectGroupDeleteRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.PROJECT_GROUP_UPDATE]: (payload?: ProjectGroupUpdateRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.PROJECT_MOVE_TO_GROUP]: (payload?: ProjectMoveToGroupRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.PROJECT_REORDER]: (payload?: ReorderRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.THREAD_CREATE]: (payload?: ThreadCreateRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.THREAD_UPDATE]: (payload?: ThreadUpdateRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.THREAD_REORDER]: (payload?: ReorderRequest) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.THREAD_OPEN]: (
    payload?: ThreadOpenRequest
  ) => IpcResult<ActiveThreadDetail>;
  [CHANNELS.MESSAGE_SEND]: (
    payload?: MessageSendRequest
  ) => IpcResult<ActiveThreadDetail>;
}

/**
 * Creates the IPC handler objects bound to the provided database connection.
 * Exported separately so tests can invoke handlers directly.
 */
export function createWorkspaceHandlers(db: Database): WorkspaceHandlers {
    return {
    handleWorkspaceLoad: () => loadWorkspace(db),
    handleProjectCreate: (name: string) => createProject(db, name),
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
  return {
    name: typeof payload?.name === "string" ? payload.name : "",
  };
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
    [CHANNELS.WORKSPACE_LOAD]: () => {
      logRequest(CHANNELS.WORKSPACE_LOAD, "request");
      const result = handlers.handleWorkspaceLoad();
      logRequest(
        CHANNELS.WORKSPACE_LOAD,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
    [CHANNELS.PROJECT_CREATE]: (payload) => {
      const request = normalizeProjectCreateRequest(payload);
      logRequest(CHANNELS.PROJECT_CREATE, `request name=${request.name}`);
      const result = handlers.handleProjectCreate(request.name);
      logRequest(
        CHANNELS.PROJECT_CREATE,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
    [CHANNELS.PROJECT_DELETE]: (payload) => {
      const request = normalizeProjectDeleteRequest(payload);
      logRequest(
        CHANNELS.PROJECT_DELETE,
        `request projectId=${request.projectId}`
      );
      const result = handlers.handleProjectDelete(request.projectId);
      logRequest(
        CHANNELS.PROJECT_DELETE,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
        [CHANNELS.PROJECT_UPDATE]: (payload) => {
      const request = normalizeProjectUpdateRequest(payload);
      logRequest(CHANNELS.PROJECT_UPDATE, `request projectId=${request.projectId}`);
      const result = handlers.handleProjectUpdate(request.projectId, request.name, request.isCollapsed);
      logRequest(CHANNELS.PROJECT_UPDATE, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_GROUP_CREATE]: (payload) => {
      const request = normalizeProjectGroupCreateRequest(payload);
      logRequest(CHANNELS.PROJECT_GROUP_CREATE, `request name=${request.name}`);
      const result = handlers.handleProjectGroupCreate(request.name);
      logRequest(CHANNELS.PROJECT_GROUP_CREATE, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_GROUP_DELETE]: (payload) => {
      const request = normalizeProjectGroupDeleteRequest(payload);
      logRequest(CHANNELS.PROJECT_GROUP_DELETE, `request groupId=${request.groupId}`);
      const result = handlers.handleProjectGroupDelete(request.groupId);
      logRequest(CHANNELS.PROJECT_GROUP_DELETE, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_GROUP_UPDATE]: (payload) => {
      const request = normalizeProjectGroupUpdateRequest(payload);
      logRequest(CHANNELS.PROJECT_GROUP_UPDATE, `request groupId=${request.groupId}`);
      const result = handlers.handleProjectGroupUpdate(request.groupId, request.name);
      logRequest(CHANNELS.PROJECT_GROUP_UPDATE, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_MOVE_TO_GROUP]: (payload) => {
      const request = normalizeProjectMoveToGroupRequest(payload);
      logRequest(CHANNELS.PROJECT_MOVE_TO_GROUP, `request projectId=${request.projectId}`);
      const result = handlers.handleProjectMoveToGroup(request.projectId, request.groupId);
      logRequest(CHANNELS.PROJECT_MOVE_TO_GROUP, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.PROJECT_REORDER]: (payload) => {
      const request = normalizeReorderRequest(payload);
      logRequest(CHANNELS.PROJECT_REORDER, `request itemId=${request.itemId}`);
      const result = handlers.handleProjectReorder(request.itemId, request.targetSortOrder);
      logRequest(CHANNELS.PROJECT_REORDER, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.THREAD_UPDATE]: (payload) => {
      const request = normalizeThreadUpdateRequest(payload);
      logRequest(CHANNELS.THREAD_UPDATE, `request threadId=${request.threadId}`);
      const result = handlers.handleThreadUpdate(request.threadId, request.title);
      logRequest(CHANNELS.THREAD_UPDATE, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.THREAD_REORDER]: (payload) => {
      const request = normalizeReorderRequest(payload);
      logRequest(CHANNELS.THREAD_REORDER, `request itemId=${request.itemId}`);
      const result = handlers.handleThreadReorder(request.itemId, request.targetSortOrder);
      logRequest(CHANNELS.THREAD_REORDER, result.success ? "success" : `error ${result.error.code}`);
      return result;
    },
    [CHANNELS.THREAD_CREATE]: (payload) => {
      const request = normalizeThreadCreateRequest(payload);
      logRequest(CHANNELS.THREAD_CREATE, `request projectId=${request.projectId}`);
      const result = handlers.handleThreadCreate(request.projectId);
      logRequest(
        CHANNELS.THREAD_CREATE,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
    [CHANNELS.THREAD_OPEN]: (payload) => {
      const request = normalizeThreadOpenRequest(payload);
      logRequest(CHANNELS.THREAD_OPEN, `request threadId=${request.threadId}`);
      const result = handlers.handleThreadOpen(request.threadId);
      logRequest(
        CHANNELS.THREAD_OPEN,
        result.success ? "success" : `error ${result.error.code}`
      );
      return result;
    },
    [CHANNELS.MESSAGE_SEND]: (payload) => {
      const request = {
        threadId: typeof payload?.threadId === "string" ? payload.threadId : "",
        content: typeof payload?.content === "string" ? payload.content : "",
        role: typeof payload?.role === "string" ? payload.role : "user",
      };

      logRequest(CHANNELS.MESSAGE_SEND, `request threadId=${request.threadId}`);
      const result = handlers.handleMessageSend(
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
