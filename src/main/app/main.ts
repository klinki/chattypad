/**
 * Main process entry point for the ChattyPad desktop application.
 * Initializes the database, registers IPC handlers, and creates the application window.
 */
import fs from "fs";
import path from "path";
import { initializeSchema } from "../database/schema.js";
import { getDatabase, resolveDatabasePath } from "../database/sqlite.js";
import type { WorkspaceElectrobunRpcSchema } from "../../shared/contracts/electrobun-rpc.js";
import {
  createWorkspaceRpcRequestHandlers,
  type WorkspaceRpcRequestHandlers,
} from "../ipc/workspace-ipc.js";
import { resolveWindowConfig, type WindowMode } from "./window-config.js";

import { IPC_CHANNELS as CHANNELS } from "../../shared/contracts/workspace.js";
import type { WindowFrameUpdateRequest } from "../../shared/contracts/workspace.js";

const debugStartupEnabled = process.env["CHATTYPAD_DEBUG"] === "1";
const startupLogPath = path.resolve(
  process.env["TEMP"] ?? process.cwd(),
  "chattypad",
  "startup.log"
);

interface ElectrobunRuntimeModule {
  BrowserWindow: new (options: {
    url: string;
    html: string | null;
    preload: string | null;
    renderer?: "native" | "cef";
    rpc: unknown;
    title: string;
    frame: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    titleBarStyle: "default" | "hidden" | "hiddenInset";
    transparent: boolean;
    navigationRules: string | null;
    sandbox: boolean;
  }) => unknown;
    defineElectrobunRPC: <Schema extends WorkspaceElectrobunRpcSchema>(
    side: "bun",
    config: {
      handlers: {
        requests: Record<string, unknown>;
        messages: any;
      };
    }
  ) => unknown;
}

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

initializeStartupLogging();
logStartup("Main module loaded");

process.on("uncaughtException", (error) => {
  logStartupError("Uncaught exception", error);
});

process.on("unhandledRejection", (reason) => {
  logStartupError("Unhandled promise rejection", reason);
});

async function loadElectrobunRuntime(): Promise<ElectrobunRuntimeModule | null> {
  logStartup("Loading Electrobun runtime module");

  try {
    const dynamicImport = new Function(
      "specifier",
      "return import(specifier);"
    ) as (specifier: string) => Promise<ElectrobunRuntimeModule>;

    const runtime = await dynamicImport("electrobun/bun");
    logStartup("Electrobun runtime module loaded");
    return runtime;
  } catch (error) {
    logStartupError('Failed to import "electrobun/bun"', error);
    return null;
  }
}

async function bootstrap(): Promise<void> {
  logStartup(
    "Bootstrapping ChattyPad",
    debugStartupEnabled
      ? `cwd=${process.cwd()}\ndatabase=${resolveDatabasePath()}`
      : undefined
  );

  logStartup("Opening SQLite database");
  const db = getDatabase();
  logStartup("SQLite database ready");

  logStartup("Initializing database schema");
  initializeSchema(db);
  logStartup("Database schema initialized");


  const electrobunRuntime = await loadElectrobunRuntime();

  logStartup("Creating workspace RPC request handlers");
  const workspaceRequestHandlers = createWorkspaceRpcRequestHandlers(db);

  if (!electrobunRuntime) {
    throw new Error(
      'Electrobun runtime is not available. Launch ChattyPad through "electrobun dev" (or "npm run start"), not plain "bun run".'
    );
  }

  let mainWindow: any;

  let isMaximized = false;

  logStartup("Defining Electrobun RPC bridge");
  const requestHandlers = {
    ...workspaceRequestHandlers,
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

  const rpc = electrobunRuntime.defineElectrobunRPC<WorkspaceElectrobunRpcSchema>(
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
    }
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

  mainWindow = new electrobunRuntime.BrowserWindow({
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
    // @ts-ignore: inject styleMask to force resizable frameless window if supported
    styleMask: windowConfig.styleMask,
    transparent: windowConfig.transparent,
    navigationRules: null,
    sandbox: false,
  });
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
