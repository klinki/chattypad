import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, test } from "bun:test";
import {
  DEFAULT_DATABASE_FILENAME,
  SETTINGS_FILENAME,
  SettingsManager,
  resolveDefaultDatabaseDir,
} from "../../src/main/app/settings.js";
import { resolveDatabasePath } from "../../src/main/database/sqlite.js";

const tempDirectories: string[] = [];

function createTempDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "chattypad-settings-"));
  tempDirectories.push(directory);
  return directory;
}

function writeSettingsFile(settingsPath: string, databaseDir: string): void {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(
    settingsPath,
    `${JSON.stringify({ general: { databaseDir } }, null, 2)}\n`,
    "utf8"
  );
}

afterEach(() => {
  while (tempDirectories.length > 0) {
    const directory = tempDirectories.pop();
    if (directory) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
});

describe("SettingsManager", () => {
  test("loads settings from CHATTYPAD_HOME before all fallback locations", async () => {
    const root = createTempDirectory();
    const appDirectory = path.join(root, "app");
    const homeDirectory = path.join(root, "home");
    const xdgConfigHome = path.join(root, "xdg");
    const configuredHome = path.join(root, "chattypad-home");

    writeSettingsFile(
      path.join(configuredHome, SETTINGS_FILENAME),
      path.join(root, "db-from-env")
    );
    writeSettingsFile(
      path.join(appDirectory, SETTINGS_FILENAME),
      path.join(root, "db-from-app")
    );
    writeSettingsFile(
      path.join(homeDirectory, ".chattypad", SETTINGS_FILENAME),
      path.join(root, "db-from-home")
    );
    writeSettingsFile(
      path.join(xdgConfigHome, "chattypad", SETTINGS_FILENAME),
      path.join(root, "db-from-xdg")
    );

    const manager = new SettingsManager({
      appDirectory,
      env: {
        CHATTYPAD_HOME: configuredHome,
        HOME: homeDirectory,
        XDG_CONFIG_HOME: xdgConfigHome,
      },
      platform: "linux",
    });

    const settings = await manager.load();

    expect(settings.general.databaseDir).toBe(
      path.resolve(root, "db-from-env")
    );
    expect(manager.getSettingsPath()).toBe(
      path.resolve(configuredHome, SETTINGS_FILENAME)
    );
  });

  test("uses the application directory as the preferred save location when no settings file exists", async () => {
    const root = createTempDirectory();
    const appDirectory = path.join(root, "app");
    const homeDirectory = path.join(root, "home");

    const manager = new SettingsManager({
      appDirectory,
      env: {
        HOME: homeDirectory,
      },
      platform: "linux",
    });

    const settings = await manager.load();

    expect(settings.general.databaseDir).toBe(
      path.resolve(homeDirectory, ".chattypad")
    );
    expect(manager.getSettingsPath()).toBe(
      path.resolve(appDirectory, SETTINGS_FILENAME)
    );
  });

  test("uses the platform default database directory when no explicit value is configured", () => {
    const root = createTempDirectory();
    const roamingPath = path.join(root, "Roaming");

    const databaseDir = resolveDefaultDatabaseDir("win32", {
      APPDATA: roamingPath,
    });

    expect(databaseDir).toBe(path.resolve(roamingPath, "chattypad"));
  });

  test("persists updated settings and creates the configured database directory", async () => {
    const root = createTempDirectory();
    const configuredHome = path.join(root, "config-home");
    const targetDatabaseDir = path.join(root, "custom-db");

    const manager = new SettingsManager({
      appDirectory: path.join(root, "app"),
      env: {
        CHATTYPAD_HOME: configuredHome,
        HOME: path.join(root, "home"),
      },
      platform: "linux",
    });

    await manager.load();
    const settings = await manager.updateSettings({
      general: {
        databaseDir: targetDatabaseDir,
      },
    });

    const settingsPath = path.join(configuredHome, SETTINGS_FILENAME);
    const persistedSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

    expect(settings.general.databaseDir).toBe(path.resolve(targetDatabaseDir));
    expect(fs.existsSync(targetDatabaseDir)).toBe(true);
    expect(persistedSettings).toEqual({
      general: {
        databaseDir: path.resolve(targetDatabaseDir),
      },
    });
  });

  test("resolves the SQLite file inside the configured database directory", () => {
    const databaseDir = path.join("tmp", "chattypad-data");

    expect(resolveDatabasePath(databaseDir)).toBe(
      path.resolve(databaseDir, DEFAULT_DATABASE_FILENAME)
    );
  });
});
