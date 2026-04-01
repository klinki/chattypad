/**
 * Main process entry point for the ChattyPad desktop application.
 * Initializes the database, registers IPC handlers, and creates the application window.
 */
import fs from "fs";
import path from "path";
import { dlopen, FFIType } from "bun:ffi";
import { BrowserWindow, defineElectrobunRPC } from "electrobun/bun";
import { native as electrobunNative, toCString } from "../../../node_modules/electrobun/dist/api/bun/proc/native";
import { initializeSchema } from "../database/schema.js";
import { getDatabase, resolveDatabasePath } from "../database/sqlite.js";
import type { WorkspaceElectrobunRpcSchema } from "../../shared/contracts/electrobun-rpc.js";
import {
  createWorkspaceRpcRequestHandlers,
  type WorkspaceRpcRequestHandlers,
} from "../ipc/workspace-ipc.js";
import { SettingsManager } from "./settings.js";
import { createSettingsRpcRequestHandlers } from "../ipc/settings.js";
import { resolveWindowConfig, type WindowMode } from "./window-config.js";

import { IPC_CHANNELS as CHANNELS } from "../../shared/contracts/workspace.js";
import type { WindowFrameUpdateRequest } from "../../shared/contracts/workspace.js";

const debugStartupEnabled = process.env["CHATTYPAD_DEBUG"] === "1";
const startupLogPath = path.resolve(
  process.env["TEMP"] ?? process.cwd(),
  "chattypad",
  "startup.log"
);

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }

  return typeof error === "string" ? error : JSON.stringify(error);
}

function appendStartupLog(level: "INFO" | "ERROR", message: string): void {
  fs.mkdirSync(path.dirname(startupLogPath), { recursive: true });
  fs.appendFileSync(
    startupLogPath,
    `${new Date().toISOString()} [${level}] ${message}\n`,
    "utf8"
  );
}

function logStartup(message: string, details?: string): void {
  console.log(`[startup] ${message}`);
  appendStartupLog("INFO", details ? `${message}\n${details}` : message);

  if (details && debugStartupEnabled) {
    console.log(details);
  }
}

function logStartupError(message: string, error: unknown): void {
  const details = formatError(error);
  console.error(`[startup] ${message}`);
  console.error(details);
  appendStartupLog("ERROR", `${message}\n${details}`);
}

function initializeStartupLogging(): void {
  fs.mkdirSync(path.dirname(startupLogPath), { recursive: true });
  fs.writeFileSync(startupLogPath, "", "utf8");

  if (debugStartupEnabled) {
    console.log(`[startup] Debug log file: ${startupLogPath}`);
    appendStartupLog("INFO", "Debug logging enabled");
  }
}

function createWindowUnavailableResult() {
  return {
    success: false as const,
    error: {
      code: "WINDOW_UNAVAILABLE",
      message: "Window is not available.",
      recoverable: false,
    },
  };
}

const windowsIconCandidates = [
  path.resolve(process.cwd(), "assets", "icon.ico"),
  path.resolve(process.cwd(), "Resources", "app.ico"),
  path.resolve(process.cwd(), "..", "Resources", "app.ico"),
];

const IMAGE_ICON = 1;
const LR_LOADFROMFILE = 0x0010;
const LR_DEFAULTSIZE = 0x0040;
const WM_SETICON = 0x0080;
const ICON_SMALL = 0;
const ICON_BIG = 1;
const GCLP_HICON = -14;
const GCLP_HICONSM = -34;

let windowsUser32: any = null;

function getWindowsUser32(): any {
  if (!windowsUser32) {
    windowsUser32 = dlopen("user32.dll", {
      LoadImageA: {
        args: [
          FFIType.ptr,
          FFIType.cstring,
          FFIType.u32,
          FFIType.i32,
          FFIType.i32,
          FFIType.u32,
        ],
        returns: FFIType.ptr,
      },
      SendMessageA: {
        args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr],
        returns: FFIType.ptr,
      },
      SetClassLongPtrA: {
        args: [FFIType.ptr, FFIType.i32, FFIType.ptr],
        returns: FFIType.ptr,
      },
    });
  }

  return windowsUser32;
}

function resolveWindowsWindowIconPath(): string | null {
  for (const candidate of windowsIconCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function applyWindowsWindowIcon(windowHandle: any): void {
  if (process.platform !== "win32") {
    return;
  }

  const iconPath = resolveWindowsWindowIconPath();
  if (!iconPath) {
    logStartup("Windows icon asset not found for window chrome");
    return;
  }

  try {
    const user32 = getWindowsUser32();
    const iconHandle = user32.symbols.LoadImageA(
      null,
      toCString(iconPath),
      IMAGE_ICON,
      0,
      0,
      LR_LOADFROMFILE | LR_DEFAULTSIZE
    );

    if (iconHandle) {
      user32.symbols.SetClassLongPtrA(windowHandle, GCLP_HICON, iconHandle);
      user32.symbols.SetClassLongPtrA(windowHandle, GCLP_HICONSM, iconHandle);
      user32.symbols.SendMessageA(windowHandle, WM_SETICON, ICON_BIG, iconHandle);
      user32.symbols.SendMessageA(windowHandle, WM_SETICON, ICON_SMALL, iconHandle);
    }

    electrobunNative.symbols.setWindowIcon(windowHandle, toCString(iconPath));
    logStartup(
      "Applied Windows window icon",
      debugStartupEnabled ? `icon=${iconPath}` : undefined
    );
  } catch (error) {
    logStartupError("Failed to apply Windows window icon", error);
  }
}

initializeStartupLogging();
logStartup("Main module loaded");

process.on("uncaughtException", (error) => {
  logStartupError("Uncaught exception", error);
});

process.on("unhandledRejection", (reason) => {
  logStartupError("Unhandled promise rejection", reason);
});

async function bootstrap(): Promise<void> {
  logStartup("Bootstrapping ChattyPad", debugStartupEnabled ? `cwd=${process.cwd()}` : undefined);

  logStartup("Loading settings");
  const settingsManager = new SettingsManager();
  const settings = await settingsManager.load();
  logStartup(
    "Settings loaded",
    debugStartupEnabled
      ? `settings=${settingsManager.getSettingsPath()}\ndatabase=${resolveDatabasePath(
          settings.general.databaseDir
        )}`
      : undefined
  );

  logStartup("Opening SQLite database");
  const db = getDatabase(settings.general.databaseDir);
  logStartup("SQLite database ready");

  logStartup("Initializing database schema");
  initializeSchema(db);
  logStartup("Database schema initialized");

  logStartup("Creating workspace RPC request handlers");
  const workspaceRequestHandlers = createWorkspaceRpcRequestHandlers(db);
  const settingsRequestHandlers = createSettingsRpcRequestHandlers(settingsManager);

  let mainWindow: any;

  let isMaximized = false;

  logStartup("Defining Electrobun RPC bridge");
  const requestHandlers = {
    ...workspaceRequestHandlers,
    ...settingsRequestHandlers,
    [CHANNELS.WINDOW_GET_FRAME]: () => {
      if (!mainWindow?.getFrame) {
        return createWindowUnavailableResult();
      }

      return {
        success: true as const,
        data: mainWindow.getFrame(),
      };
    },
    [CHANNELS.WINDOW_SET_FRAME]: (payload?: WindowFrameUpdateRequest) => {
      if (
        !mainWindow?.setFrame ||
        !payload ||
        !Number.isFinite(payload.x) ||
        !Number.isFinite(payload.y) ||
        !Number.isFinite(payload.width) ||
        !Number.isFinite(payload.height)
      ) {
        return createWindowUnavailableResult();
      }

      mainWindow.setFrame(payload.x, payload.y, payload.width, payload.height);
      return {
        success: true as const,
        data: payload,
      };
    },
  } satisfies Record<string, unknown>;

  const rpc = defineElectrobunRPC<WorkspaceElectrobunRpcSchema>(
    "bun",
    {
      handlers: {
        requests: requestHandlers,
        messages: {
          [CHANNELS.WINDOW_MINIMIZE]: () => {
            logStartup("Minimizing window");
            // @ts-ignore
            if (mainWindow?.minimize) mainWindow.minimize();
          },
          [CHANNELS.WINDOW_MAXIMIZE]: () => {
            logStartup(`Maximizing window (currently ${isMaximized})`);
            if (isMaximized) {
              // @ts-ignore
              if (mainWindow?.unmaximize) mainWindow.unmaximize();
              isMaximized = false;
            } else {
              // @ts-ignore
              if (mainWindow?.maximize) mainWindow.maximize();
              isMaximized = true;
            }
          },
          [CHANNELS.WINDOW_CLOSE]: () => {
            logStartup("Closing window");
            // @ts-ignore
            if (mainWindow?.close) mainWindow.close();
            else process.exit(0);
          },
        },
      },
    } as any
  );

  logStartup(
    "Creating BrowserWindow",
    debugStartupEnabled ? "url=views://renderer/index.html" : undefined
  );
  const requestedWindowMode: WindowMode | undefined =
    process.platform === "win32"
      ? process.env["CHATTYPAD_WIN_FRAMELESS"] === "1"
        ? "frameless"
        : "native"
      : undefined;
  const windowConfig = resolveWindowConfig(process.platform, requestedWindowMode);
  logStartup(
    "Resolved window configuration",
    debugStartupEnabled
      ? `platform=${process.platform}\nmode=${windowConfig.windowMode}\nrenderer=${windowConfig.renderer}\ntransparent=${windowConfig.transparent}`
      : undefined
  );

  mainWindow = new BrowserWindow({
    url: "views://renderer/index.html",
    html: null,
    preload: null,
    renderer: windowConfig.renderer,
    rpc,
    title: "ChattyPad",
    frame: {
      x: 0,
      y: 0,
      width: 1200,
      height: 800,
    },
    titleBarStyle: windowConfig.titleBarStyle,
    hidden: process.platform === "win32",
    // @ts-ignore: inject styleMask to force resizable frameless window if supported
    styleMask: windowConfig.styleMask,
    transparent: windowConfig.transparent,
    navigationRules: null,
    sandbox: false,
  });
  applyWindowsWindowIcon(mainWindow.ptr);
  if (process.platform === "win32") {
    mainWindow.show();
  }
  // Pass the selected window mode without modifying the HTML asset URL.
  mainWindow.webview?.on?.("dom-ready", () => {
    mainWindow.webview.executeJavascript(
      `window.__CHATTYPAD_WINDOW_MODE__ = ${JSON.stringify(windowConfig.windowMode)}; window.dispatchEvent(new CustomEvent("chattypad-window-mode", { detail: window.__CHATTYPAD_WINDOW_MODE__ }));`
    );
  });
  logStartup("BrowserWindow created");
}

bootstrap().catch((err) => {
  logStartupError("Fatal error during bootstrap", err);
  console.error("Fatal error during bootstrap:", err);
  process.exit(1);
});
