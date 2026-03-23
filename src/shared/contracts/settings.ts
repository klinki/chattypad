export interface Settings {
  general: {
    databaseDir: string;
  };
}

export interface SettingsUpdateRequest {
  general?: {
    databaseDir?: string;
  };
}

export interface SettingsContract {
  getSettings: () => Promise<Settings>;
  updateSettings: (partialSettings: Partial<Settings>) => Promise<Settings>;
}

export const SETTINGS_IPC_CHANNELS = {
  SETTINGS_GET: "settings:get",
  SETTINGS_UPDATE: "settings:update",
} as const;

export type SettingsIpcChannel =
  (typeof SETTINGS_IPC_CHANNELS)[keyof typeof SETTINGS_IPC_CHANNELS];
