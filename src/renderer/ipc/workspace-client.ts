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
} from "../../shared/contracts/workspace.js";
import { IPC_CHANNELS } from "../../shared/contracts/workspace.js";
import type {
  MessageSendRequest,
  ThreadOpenRequest,
  WorkspaceElectrobunRpcSchema,
} from "../../shared/contracts/electrobun-rpc.js";

export interface WorkspaceIpcClient {
  loadWorkspace(): Promise<IpcResult<WorkspaceSnapshot>>;
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

interface ElectrobunViewRuntime {
  Electroview: {
    new (options: { rpc: WorkspaceRendererRpc }): unknown;
    defineRPC<Schema extends WorkspaceElectrobunRpcSchema>(config: {
      handlers: {
        requests: Record<never, never>;
        messages: Record<never, never>;
      };
    }): WorkspaceRendererRpc;
  };
}

let bridgePromise: Promise<WorkspaceRpcRequestProxy | null> | null = null;

function hasElectrobunRuntime(): boolean {
  const globalScope = globalThis as Record<string, unknown>;
  return (
    typeof globalScope.__electrobun === "object" &&
    globalScope.__electrobun !== null &&
    typeof globalScope.__electrobunWebviewId === "number" &&
    typeof globalScope.__electrobunRpcSocketPort === "number"
  );
}

async function getBridge(): Promise<WorkspaceRpcRequestProxy | null> {
  if (!bridgePromise) {
    bridgePromise = (async () => {
      if (!hasElectrobunRuntime()) {
        return null;
      }

      try {
        const dynamicImport = new Function(
          "specifier",
          "return import(specifier);"
        ) as (specifier: string) => Promise<ElectrobunViewRuntime>;
        const { Electroview } = await dynamicImport("electrobun/view");
        const rpc = Electroview.defineRPC<WorkspaceElectrobunRpcSchema>({
          handlers: {
            requests: {},
            messages: {},
          },
        });

        new Electroview({ rpc });

        return rpc.request;
      } catch {
        return null;
      }
    })();
  }

  return bridgePromise;
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
  const bridge = await getBridge();

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
  openThread: (threadId: ThreadOpenRequest["threadId"]) =>
    invokeIpc(IPC_CHANNELS.THREAD_OPEN, { threadId }),
  sendMessage: (threadId, content, role) =>
    invokeIpc(IPC_CHANNELS.MESSAGE_SEND, {
      threadId,
      content,
      role,
    } satisfies MessageSendRequest),
};
