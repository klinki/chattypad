import Electrobun, { Electroview } from "electrobun/view";
import type { WorkspaceElectrobunRpcSchema } from "../../shared/contracts/electrobun-rpc.js";

type WorkspaceRequestMap = WorkspaceElectrobunRpcSchema["bun"]["requests"];

export type WorkspaceRpcRequestProxy = {
  [Channel in keyof WorkspaceRequestMap]: undefined extends WorkspaceRequestMap[Channel]["params"]
    ? (
        payload?: WorkspaceRequestMap[Channel]["params"]
      ) => Promise<WorkspaceRequestMap[Channel]["response"]>
    : (
        payload: WorkspaceRequestMap[Channel]["params"]
      ) => Promise<WorkspaceRequestMap[Channel]["response"]>;
};

export interface ElectrobunBridge {
  request: WorkspaceRpcRequestProxy;
  send: (channel: string, payload?: unknown) => void;
}

let bridge: ElectrobunBridge | null | undefined;

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

export function getElectrobunBridge(): ElectrobunBridge | null {
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
    bridge = {
      request: (electrobun.rpc?.request ?? rpc.request) as WorkspaceRpcRequestProxy,
      send: (electrobun.rpc?.send ?? rpc.send) as (channel: string, payload?: unknown) => void,
    };
  } catch (error) {
    console.error("Failed to initialize the Electrobun IPC bridge.", error);
    bridge = null;
  }

  return bridge;
}
