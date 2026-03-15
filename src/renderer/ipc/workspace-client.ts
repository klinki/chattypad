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
} from "../../shared/contracts/workspace.js";
import { IPC_CHANNELS } from "../../shared/contracts/workspace.js";
import type {
  MessageSendRequest,
  ThreadOpenRequest,
  WorkspaceElectrobunRpcSchema,
} from "../../shared/contracts/electrobun-rpc.js";

export interface WorkspaceIpcClient {
  loadWorkspace(): Promise<IpcResult<WorkspaceSnapshot>>;
  createProject(name: string): Promise<IpcResult<WorkspaceSnapshot>>;
  deleteProject(projectId: string): Promise<IpcResult<WorkspaceSnapshot>>;
  openThread(threadId: string): Promise<IpcResult<ActiveThreadDetail>>;
  sendMessage(
    threadId: string,
    content: string,
    role: string
  ): Promise<IpcResult<ActiveThreadDetail>>;
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
  } catch (error) {
    console.error("Failed to initialize the Electrobun IPC bridge.", error);
    bridge = null;
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

async function invokeIpc<Channel extends IpcChannel>(
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

export const workspaceIpcClient: WorkspaceIpcClient = {
  loadWorkspace: () => invokeIpc(IPC_CHANNELS.WORKSPACE_LOAD),
  createProject: (name: ProjectCreateRequest["name"]) =>
    invokeIpc(IPC_CHANNELS.PROJECT_CREATE, { name }),
  deleteProject: (projectId: ProjectDeleteRequest["projectId"]) =>
    invokeIpc(IPC_CHANNELS.PROJECT_DELETE, { projectId }),
  openThread: (threadId: ThreadOpenRequest["threadId"]) =>
    invokeIpc(IPC_CHANNELS.THREAD_OPEN, { threadId }),
  sendMessage: (threadId, content, role) =>
    invokeIpc(IPC_CHANNELS.MESSAGE_SEND, {
      threadId,
      content,
      role,
    } satisfies MessageSendRequest),
};
