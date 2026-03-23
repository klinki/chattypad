import fs from "fs/promises";
import path from "path";
import type { Settings, SettingsUpdateRequest } from "../../shared/contracts/settings.js";

export const SETTINGS_FILENAME = "settings.json";
export const DEFAULT_DATABASE_FILENAME = "chattypad.db";

export interface SettingsManagerOptions {
  appDirectory?: string;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
}

interface ResolvedSettingsPaths {
  candidates: string[];
  preferredPath: string;
}

export class SettingsValidationError extends Error {
  readonly code = "SETTINGS_INVALID";
  readonly recoverable = true;

  constructor(message: string, cause?: Error) {
    super(message, cause ? { cause } : undefined);
    this.name = "SettingsValidationError";
  }
}

export function cloneSettings(settings: Settings): Settings {
  return {
    general: {
      databaseDir: settings.general.databaseDir,
    },
  };
}

export function mergeSettings(
  base: Settings,
  partial: SettingsUpdateRequest | Partial<Settings>
): Settings {
  return {
    general: {
      databaseDir:
        partial.general?.databaseDir ?? base.general.databaseDir,
    },
  };
}

export function resolveDefaultDatabaseDir(
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv
): string {
  const configuredHome = env["CHATTYPAD_HOME"]?.trim();
  if (configuredHome) {
    return path.resolve(configuredHome);
  }

  if (platform === "win32") {
    const appData =
      env["APPDATA"]?.trim() ||
      (env["USERPROFILE"]?.trim()
        ? path.join(env["USERPROFILE"].trim(), "AppData", "Roaming")
        : "");
    if (appData) {
      return path.resolve(appData, "chattypad");
    }
  }

  const homeDirectory =
    env["HOME"]?.trim() || env["USERPROFILE"]?.trim() || process.cwd();
  return path.resolve(homeDirectory, ".chattypad");
}

export function resolveSettingsLookupPaths(
  appDirectory: string,
  env: NodeJS.ProcessEnv
): ResolvedSettingsPaths {
  const homeDirectory =
    env["HOME"]?.trim() || env["USERPROFILE"]?.trim() || process.cwd();
  const xdgConfigHome =
    env["XDG_CONFIG_HOME"]?.trim() || path.join(homeDirectory, ".config");
  const configuredHome = env["CHATTYPAD_HOME"]?.trim();

  const candidates = [
    configuredHome ? path.resolve(configuredHome, SETTINGS_FILENAME) : null,
    path.resolve(appDirectory, SETTINGS_FILENAME),
    path.resolve(homeDirectory, ".chattypad", SETTINGS_FILENAME),
    path.resolve(xdgConfigHome, "chattypad", SETTINGS_FILENAME),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return {
    candidates: [...new Set(candidates)],
    preferredPath:
      (configuredHome
        ? path.resolve(configuredHome, SETTINGS_FILENAME)
        : path.resolve(appDirectory, SETTINGS_FILENAME)),
  };
}

async function pathExists(candidatePath: string): Promise<boolean> {
  try {
    await fs.access(candidatePath);
    return true;
  } catch {
    return false;
  }
}

function isSettingsShape(value: unknown): value is SettingsUpdateRequest {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class SettingsManager {
  private readonly appDirectory: string;
  private readonly env: NodeJS.ProcessEnv;
  private readonly platform: NodeJS.Platform;
  private currentSettings: Settings | null = null;
  private settingsPath: string | null = null;

  constructor(options: SettingsManagerOptions = {}) {
    this.appDirectory = path.resolve(options.appDirectory ?? process.cwd());
    this.env = options.env ?? process.env;
    this.platform = options.platform ?? process.platform;
  }

  getSettings(): Settings {
    if (!this.currentSettings) {
      this.currentSettings = this.buildDefaultSettings();
    }

    return cloneSettings(this.currentSettings);
  }

  getSettingsPath(): string {
    if (!this.settingsPath) {
      this.settingsPath = this.resolveLookupPaths().preferredPath;
    }

    return this.settingsPath;
  }

  async load(): Promise<Settings> {
    const { candidates, preferredPath } = this.resolveLookupPaths();
    const existingPath = await this.findExistingPath(candidates);
    const settingsPath = existingPath ?? preferredPath;
    this.settingsPath = settingsPath;

    if (!existingPath) {
      this.currentSettings = await this.normalizeSettings({});
      return this.getSettings();
    }

    const rawContent = await fs.readFile(existingPath, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      throw new SettingsValidationError(
        `Could not parse settings file at ${existingPath}.`,
        error instanceof Error ? error : undefined
      );
    }

    this.currentSettings = await this.normalizeSettings(parsed);
    return this.getSettings();
  }

  async updateSettings(
    partialSettings: SettingsUpdateRequest | Partial<Settings>
  ): Promise<Settings> {
    const nextSettings = mergeSettings(this.getSettings(), partialSettings);
    this.currentSettings = await this.normalizeSettings(nextSettings);
    await this.save();
    return this.getSettings();
  }

  async save(): Promise<void> {
    const settings = this.getSettings();
    const settingsPath = this.getSettingsPath();
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.mkdir(settings.general.databaseDir, { recursive: true });
    await fs.writeFile(
      settingsPath,
      `${JSON.stringify(settings, null, 2)}\n`,
      "utf8"
    );
  }

  private resolveLookupPaths(): ResolvedSettingsPaths {
    return resolveSettingsLookupPaths(this.appDirectory, this.env);
  }

  private async findExistingPath(candidates: string[]): Promise<string | null> {
    for (const candidate of candidates) {
      if (await pathExists(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private buildDefaultSettings(): Settings {
    return {
      general: {
        databaseDir: resolveDefaultDatabaseDir(this.platform, this.env),
      },
    };
  }

  private async normalizeSettings(rawSettings: unknown): Promise<Settings> {
    if (!isSettingsShape(rawSettings)) {
      throw new SettingsValidationError("Settings must be a JSON object.");
    }

    const mergedSettings = mergeSettings(
      this.buildDefaultSettings(),
      rawSettings
    );

    const databaseDir = mergedSettings.general.databaseDir;
    if (typeof databaseDir !== "string" || databaseDir.trim() === "") {
      throw new SettingsValidationError("Database directory is required.");
    }

    const normalizedDatabaseDir = path.resolve(databaseDir.trim());
    await fs.mkdir(normalizedDatabaseDir, { recursive: true });

    return {
      general: {
        databaseDir: normalizedDatabaseDir,
      },
    };
  }
}
