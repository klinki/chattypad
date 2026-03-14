/**
 * IPC handler registration for the workspace feature.
 * Maps Electrobun IPC channels to workspace service calls.
 * The handler functions are exported for direct testing without the Electrobun bridge.
 *
 * Channels:
 *   workspace:load  → loadWorkspace
 *   thread:open     → openThread
 *   message:send    → sendMessage (wired in Phase 5 via message-service)
 */
import type { Database } from "bun:sqlite";
import { loadWorkspace, openThread } from "../app/workspace-service.js";
import { sendMessage } from "../app/message-service.js";
import type {
  WorkspaceSnapshot,
  ActiveThreadDetail,
  IpcResult,
} from "../../shared/contracts/workspace.js";
import { IPC_CHANNELS as CHANNELS } from "../../shared/contracts/workspace.js";
import type {
  MessageSendRequest,
  ThreadOpenRequest,
} from "../../shared/contracts/electrobun-rpc.js";

export interface WorkspaceHandlers {
  handleWorkspaceLoad: () => IpcResult<WorkspaceSnapshot>;
  handleThreadOpen: (threadId: string) => IpcResult<ActiveThreadDetail>;
  handleMessageSend: (
    threadId: string,
    content: string,
    role: string
  ) => IpcResult<ActiveThreadDetail>;
}

export interface WorkspaceRpcRequestHandlers {
  [CHANNELS.WORKSPACE_LOAD]: () => IpcResult<WorkspaceSnapshot>;
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
    handleThreadOpen: (threadId: string) => openThread(db, threadId),
    handleMessageSend: (threadId: string, content: string, role: string) =>
      sendMessage(db, { threadId, content, role }),
  };
}

function normalizeThreadOpenRequest(payload?: ThreadOpenRequest): ThreadOpenRequest {
  return {
    threadId: typeof payload?.threadId === "string" ? payload.threadId : "",
  };
}

/**
 * Builds the Electrobun request handler map from the plain workspace handlers.
 */
export function createWorkspaceRpcRequestHandlers(
  db: Database
): WorkspaceRpcRequestHandlers {
  const handlers = createWorkspaceHandlers(db);

  return {
    [CHANNELS.WORKSPACE_LOAD]: () => handlers.handleWorkspaceLoad(),
    [CHANNELS.THREAD_OPEN]: (payload) => {
      const request = normalizeThreadOpenRequest(payload);
      return handlers.handleThreadOpen(request.threadId);
    },
    [CHANNELS.MESSAGE_SEND]: (payload) => {
      const request = {
        threadId: typeof payload?.threadId === "string" ? payload.threadId : "",
        content: typeof payload?.content === "string" ? payload.content : "",
        role: typeof payload?.role === "string" ? payload.role : "user",
      };

      return handlers.handleMessageSend(
        request.threadId,
        request.content,
        request.role
      );
    },
  };
}
