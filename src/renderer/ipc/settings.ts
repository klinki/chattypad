import type { IpcResult } from "../../shared/contracts/workspace.js";
import type {
  Settings,
  SettingsUpdateRequest,
} from "../../shared/contracts/settings.js";
import { SETTINGS_IPC_CHANNELS } from "../../shared/contracts/settings.js";
import type { WorkspaceElectrobunRpcSchema } from "../../shared/contracts/electrobun-rpc.js";
import { getElectrobunBridge, type WorkspaceRpcRequestProxy } from "./electrobun-bridge.js";

export interface SettingsIpcClient {
  getSettings(): Promise<IpcResult<Settings>>;
  updateSettings(
    partialSettings: SettingsUpdateRequest
  ): Promise<IpcResult<Settings>>;
}

type SettingsChannel =
  | typeof SETTINGS_IPC_CHANNELS.SETTINGS_GET
  | typeof SETTINGS_IPC_CHANNELS.SETTINGS_UPDATE;

type SettingsRequestMap = WorkspaceElectrobunRpcSchema["bun"]["requests"];

let bridge: WorkspaceRpcRequestProxy | null | undefined;
let settingsSnapshot: Settings | null = null;
let settingsLoadPromise: Promise<IpcResult<Settings>> | null = null;

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

function cacheSettingsResult(result: IpcResult<Settings>): void {
  if (result.success) {
    settingsSnapshot = result.data;
  }
}

function loadSettings(): Promise<IpcResult<Settings>> {
  if (!settingsLoadPromise) {
    settingsLoadPromise = invokeIpc(SETTINGS_IPC_CHANNELS.SETTINGS_GET).then((result) => {
      cacheSettingsResult(result);
      return result;
    }).finally(() => {
      settingsLoadPromise = null;
    });
  }

  return settingsLoadPromise;
}

async function invokeIpc<Channel extends SettingsChannel>(
  channel: Channel,
  payload?: SettingsRequestMap[Channel]["params"]
): Promise<SettingsRequestMap[Channel]["response"]> {
  const activeBridge = getBridge();

  if (!activeBridge) {
    return unavailableBridgeResult() as SettingsRequestMap[Channel]["response"];
  }

  const request = activeBridge[channel] as (
    nextPayload?: SettingsRequestMap[Channel]["params"]
  ) => Promise<SettingsRequestMap[Channel]["response"]>;

  return request(payload);
}

export const settingsIpcClient: SettingsIpcClient = {
  getSettings: () => loadSettings(),
  updateSettings: async (partialSettings) => {
    const result = await invokeIpc(SETTINGS_IPC_CHANNELS.SETTINGS_UPDATE, partialSettings);
    cacheSettingsResult(result);
    return result;
  },
};

export function getCachedSettings(): Settings | null {
  return settingsSnapshot ? structuredClone(settingsSnapshot) : null;
}

function getBridge(): WorkspaceRpcRequestProxy | null {
  if (bridge !== undefined) {
    return bridge;
  }

  bridge = getElectrobunBridge()?.request ?? null;
  return bridge;
}
