/**
 * Renderer-side IPC client for the workspace feature.
 * In production, calls are made through the Electrobun renderer bridge.
 * The interface is designed to be swappable for tests.
 */
import Electrobun, { Electroview } from "electrobun/view";
import type {
  WorkspaceSnapshot,
  ActiveThreadDetail,
  IpcResult,
  IpcChannel,
  ProjectCreateRequest,
  ProjectDeleteRequest,
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

type WorkspaceRequestMap = WorkspaceElectrobunRpcSchema["bun"]["requests"];

type WorkspaceRpcRequestProxy = {
  [Channel in keyof WorkspaceRequestMap]: undefined extends WorkspaceRequestMap[Channel]["params"]
    ? (
        payload?: WorkspaceRequestMap[Channel]["params"]
      ) => Promise<WorkspaceRequestMap[Channel]["response"]>
    : (
        payload: WorkspaceRequestMap[Channel]["params"]
      ) => Promise<WorkspaceRequestMap[Channel]["response"]>;
};

interface WorkspaceRendererRpc {
  request: WorkspaceRpcRequestProxy;
}

let bridge: WorkspaceRpcRequestProxy | null | undefined;
let messageBridge: any | null | undefined;

function hasElectrobunRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    typeof window.__electrobun === "object" &&
    window.__electrobun !== null &&
    typeof window.__electrobunWebviewId === "number" &&
    typeof window.__electrobunRpcSocketPort === "number"
  );
}

function getBridge(): WorkspaceRpcRequestProxy | null {
  if (bridge !== undefined) {
    return bridge;
  }

  if (!hasElectrobunRuntime()) {
    bridge = null;
    messageBridge = null;
    return bridge;
  }

  try {
    const rpc = Electroview.defineRPC<WorkspaceElectrobunRpcSchema>({
      maxRequestTime: 30000,
      handlers: {
        requests: {},
        messages: {},
      },
    });

    const electrobun = new Electrobun.Electroview({ rpc });
    bridge = electrobun.rpc?.request ?? rpc.request;
    messageBridge = electrobun.rpc?.send ?? rpc.send;
  } catch (error) {
    console.error("Failed to initialize the Electrobun IPC bridge.", error);
    bridge = null;
    messageBridge = null;
  }

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
  getBridge(); // Ensure initialization
  if (messageBridge && typeof messageBridge === 'function') {
    messageBridge(channel, payload);
  } else if (messageBridge && messageBridge[channel]) {
    messageBridge[channel](payload);
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
