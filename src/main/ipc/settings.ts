import type { IpcResult } from "../../shared/contracts/workspace.js";
import type {
  Settings,
  SettingsUpdateRequest,
} from "../../shared/contracts/settings.js";
import { SETTINGS_IPC_CHANNELS } from "../../shared/contracts/settings.js";
import {
  SettingsManager,
  SettingsValidationError,
} from "../app/settings.js";

export interface SettingsHandlers {
  handleGetSettings: () => Promise<IpcResult<Settings>>;
  handleUpdateSettings: (
    partialSettings: SettingsUpdateRequest
  ) => Promise<IpcResult<Settings>>;
}

export interface SettingsRpcRequestHandlers {
  [SETTINGS_IPC_CHANNELS.SETTINGS_GET]: () => Promise<IpcResult<Settings>>;
  [SETTINGS_IPC_CHANNELS.SETTINGS_UPDATE]: (
    payload?: SettingsUpdateRequest
  ) => Promise<IpcResult<Settings>>;
}

function toSettingsError(error: unknown) {
  if (error instanceof SettingsValidationError) {
    return {
      code: error.code,
      message: error.message,
      recoverable: error.recoverable,
    };
  }

  if (error instanceof Error) {
    return {
      code: "SETTINGS_IO_FAILED",
      message: error.message || "Settings could not be loaded.",
      recoverable: false,
    };
  }

  return {
    code: "SETTINGS_IO_FAILED",
    message: "Settings could not be loaded.",
    recoverable: false,
  };
}

function normalizeSettingsUpdateRequest(
  payload?: SettingsUpdateRequest
): SettingsUpdateRequest {
  const databaseDir =
    typeof payload?.general?.databaseDir === "string"
      ? payload.general.databaseDir
      : undefined;

  if (databaseDir === undefined) {
    return {};
  }

  return {
    general: { databaseDir },
  };
}

export function createSettingsHandlers(
  settingsManager: SettingsManager
): SettingsHandlers {
  return {
    handleGetSettings: async () => {
      try {
        return {
          success: true as const,
          data: settingsManager.getSettings(),
        };
      } catch (error) {
        return {
          success: false as const,
          error: toSettingsError(error),
        };
      }
    },
    handleUpdateSettings: async (partialSettings) => {
      try {
        return {
          success: true as const,
          data: await settingsManager.updateSettings(partialSettings),
        };
      } catch (error) {
        return {
          success: false as const,
          error: toSettingsError(error),
        };
      }
    },
  };
}

export function createSettingsRpcRequestHandlers(
  settingsManager: SettingsManager
): SettingsRpcRequestHandlers {
  const handlers = createSettingsHandlers(settingsManager);

  return {
    [SETTINGS_IPC_CHANNELS.SETTINGS_GET]: () => handlers.handleGetSettings(),
    [SETTINGS_IPC_CHANNELS.SETTINGS_UPDATE]: (payload) =>
      handlers.handleUpdateSettings(normalizeSettingsUpdateRequest(payload)),
  };
}
