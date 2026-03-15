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
} from "../app/workspace-service.js";
import { sendMessage } from "../app/message-service.js";
import type {
  WorkspaceSnapshot,
  ActiveThreadDetail,
  IpcResult,
  ProjectCreateRequest,
  ProjectDeleteRequest,
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
  handleThreadCreate: (projectId: string) => IpcResult<WorkspaceSnapshot>;
  handleThreadOpen: (threadId: string) => IpcResult<ActiveThreadDetail>;
  handleMessageSend: (
    threadId: string,
    content: string,
    role: string
  ) => IpcResult<ActiveThreadDetail>;
}

export interface WorkspaceRpcRequestHandlers {
  [CHANNELS.WORKSPACE_LOAD]: () => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.PROJECT_CREATE]: (
    payload?: ProjectCreateRequest
  ) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.PROJECT_DELETE]: (
    payload?: ProjectDeleteRequest
  ) => IpcResult<WorkspaceSnapshot>;
  [CHANNELS.THREAD_CREATE]: (
    payload?: ThreadCreateRequest
  ) => IpcResult<WorkspaceSnapshot>;
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
    handleThreadCreate: (projectId: string) => createThread(db, projectId),
    handleThreadOpen: (threadId: string) => openThread(db, threadId),
    handleMessageSend: (threadId: string, content: string, role: string) =>
      sendMessage(db, { threadId, content, role }),
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
