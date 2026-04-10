/**
 * Renderer-side IPC client for the workspace feature.
 * In production, calls are made through the Electrobun renderer bridge.
 * The interface is designed to be swappable for tests.
 */
import type {
  WorkspaceSnapshot,
  ActiveThreadDetail,
  IpcResult,
  IpcChannel,
  ProjectCreateRequest,
  ProjectDeleteRequest,
  WorkspaceSearchResult,
  ThreadCreateRequest,
  WindowFrame,
  WindowFrameUpdateRequest,
} from "../../shared/contracts/workspace.js";
import { IPC_CHANNELS } from "../../shared/contracts/workspace.js";
import type {
  MessageSendRequest,
  ThreadOpenRequest,
  WorkspaceElectrobunRpcSchema,
} from "../../shared/contracts/electrobun-rpc.js";
import { getElectrobunBridge, type WorkspaceRpcRequestProxy } from "./electrobun-bridge.js";

export interface WorkspaceIpcClient {
  loadWorkspace(): Promise<IpcResult<WorkspaceSnapshot>>;
  createProject(name: string, isEncrypted?: boolean, password?: string): Promise<IpcResult<WorkspaceSnapshot>>;
  unlockProject(projectId: string, password: string): Promise<IpcResult<void>>;
  lockProject(projectId: string): Promise<IpcResult<void>>;
  lockAllProjects(): Promise<IpcResult<void>>;
  deleteProject(projectId: string): Promise<IpcResult<WorkspaceSnapshot>>;
  updateProject(projectId: string, name?: string, isCollapsed?: boolean): Promise<IpcResult<WorkspaceSnapshot>>;
  createThread(projectId: string): Promise<IpcResult<WorkspaceSnapshot>>;
  updateThread(threadId: string, title: string): Promise<IpcResult<WorkspaceSnapshot>>;
  moveProjectToGroup(projectId: string, groupId: string | null): Promise<IpcResult<WorkspaceSnapshot>>;
  reorderProject(projectId: string, targetSortOrder: number): Promise<IpcResult<WorkspaceSnapshot>>;
  reorderThread(threadId: string, targetSortOrder: number): Promise<IpcResult<WorkspaceSnapshot>>;
  openThread(threadId: string): Promise<IpcResult<ActiveThreadDetail>>;
  searchWorkspace(query: string, limit?: number): Promise<IpcResult<WorkspaceSearchResult[]>>;
  sendMessage(
    threadId: string,
    content: string,
    role: string
  ): Promise<IpcResult<ActiveThreadDetail>>;
  getWindowFrame(): Promise<IpcResult<WindowFrame>>;
  setWindowFrame(frame: WindowFrameUpdateRequest): Promise<IpcResult<WindowFrame>>;
  minimizeWindow(): void;
  maximizeWindow(): void;
  closeWindow(): void;
}

let bridge: WorkspaceRpcRequestProxy | null | undefined;
type WorkspaceRequestMap = WorkspaceElectrobunRpcSchema["bun"]["requests"];

function getBridge(): WorkspaceRpcRequestProxy | null {
  if (bridge !== undefined) {
    return bridge;
  }

  bridge = getElectrobunBridge()?.request ?? null;

  return bridge;
}

function unavailableBridgeResult<T>(): IpcResult<T> {
  return {
    success: false,
    error: {
      code: "IPC_BRIDGE_UNAVAILABLE",
      message: "IPC bridge is not available in this environment.",
      recoverable: false,
    },
  };
}

async function invokeIpc<Channel extends keyof WorkspaceRequestMap>(
  channel: Channel,
  payload?: WorkspaceRequestMap[Channel]["params"]
): Promise<WorkspaceRequestMap[Channel]["response"]> {
  const bridge = getBridge();

  if (!bridge) {
    return unavailableBridgeResult() as WorkspaceRequestMap[Channel]["response"];
  }

  const request = bridge[channel] as (
    payload?: WorkspaceRequestMap[Channel]["params"]
  ) => Promise<WorkspaceRequestMap[Channel]["response"]>;

  return request(payload);
}

function invokeMessage(channel: string, payload?: any): void {
  const activeBridge = getElectrobunBridge();
  if (activeBridge && typeof activeBridge.send === "function") {
    activeBridge.send(channel, payload);
  } else {
    console.warn(`Cannot send IPC message: bridge unavailable for ${channel}`);
  }
}

export const workspaceIpcClient: WorkspaceIpcClient = {
  loadWorkspace: () => invokeIpc(IPC_CHANNELS.WORKSPACE_LOAD),
  createProject: (name, isEncrypted, password) => {
    const payload: ProjectCreateRequest = { name };
    if (isEncrypted !== undefined) payload.isEncrypted = isEncrypted;
    if (password !== undefined) payload.password = password;
    return invokeIpc(IPC_CHANNELS.PROJECT_CREATE, payload);
  },
  unlockProject: (projectId, password) =>
    invokeIpc(IPC_CHANNELS.PROJECT_UNLOCK, { projectId, password }),
  lockProject: (projectId) =>
    invokeIpc(IPC_CHANNELS.PROJECT_LOCK, { projectId }),
  lockAllProjects: () =>
    invokeIpc(IPC_CHANNELS.PROJECT_LOCK_ALL),
  deleteProject: (projectId: ProjectDeleteRequest["projectId"]) =>
    invokeIpc(IPC_CHANNELS.PROJECT_DELETE, { projectId }),
  createThread: (projectId: ThreadCreateRequest["projectId"]) =>
    invokeIpc(IPC_CHANNELS.THREAD_CREATE, { projectId }),
  updateProject: (projectId, name, isCollapsed) => {
    const payload: any = { projectId };
    if (name !== undefined) payload.name = name;
    if (isCollapsed !== undefined) payload.isCollapsed = isCollapsed;
    return invokeIpc(IPC_CHANNELS.PROJECT_UPDATE, payload);
  },
  updateThread: (threadId, title) =>
    invokeIpc(IPC_CHANNELS.THREAD_UPDATE, { threadId, title }),
  moveProjectToGroup: (projectId, groupId) =>
    invokeIpc(IPC_CHANNELS.PROJECT_MOVE_TO_GROUP, { projectId, groupId }),
  reorderProject: (projectId, targetSortOrder) =>
    invokeIpc(IPC_CHANNELS.PROJECT_REORDER, { itemId: projectId, targetSortOrder }),
  reorderThread: (threadId, targetSortOrder) =>
    invokeIpc(IPC_CHANNELS.THREAD_REORDER, { itemId: threadId, targetSortOrder }),
  openThread: (threadId: ThreadOpenRequest["threadId"]) =>
    invokeIpc(IPC_CHANNELS.THREAD_OPEN, { threadId }),
  searchWorkspace: (query, limit) =>
    invokeIpc(IPC_CHANNELS.WORKSPACE_SEARCH, {
      query,
      ...(limit !== undefined ? { limit } : {}),
    }),
  sendMessage: (threadId, content, role) =>
    invokeIpc(IPC_CHANNELS.MESSAGE_SEND, {
      threadId,
      content,
      role,
    } satisfies MessageSendRequest),
  getWindowFrame: () => invokeIpc(IPC_CHANNELS.WINDOW_GET_FRAME),
  setWindowFrame: (frame) => invokeIpc(IPC_CHANNELS.WINDOW_SET_FRAME, frame),
  minimizeWindow: () => invokeMessage(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximizeWindow: () => invokeMessage(IPC_CHANNELS.WINDOW_MAXIMIZE),
  closeWindow: () => invokeMessage(IPC_CHANNELS.WINDOW_CLOSE),
};
