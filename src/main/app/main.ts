/**
 * Main process entry point for the ChattyPad desktop application.
 * Initializes the database, registers IPC handlers, and creates the application window.
 */
import fs from "fs";
import path from "path";
import { initializeSchema } from "../database/schema.js";
import { getDatabase, resolveDatabasePath } from "../database/sqlite.js";
import { seedDevelopmentData } from "../database/seed.js";
import type { WorkspaceElectrobunRpcSchema } from "../../shared/contracts/electrobun-rpc.js";
import {
  createWorkspaceRpcRequestHandlers,
  type WorkspaceRpcRequestHandlers,
} from "../ipc/workspace-ipc.js";

import { IPC_CHANNELS as CHANNELS } from "../../shared/contracts/workspace.js";

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
    renderer: "native" | "cef";
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
        requests: WorkspaceRpcRequestHandlers;
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

  logStartup("Seeding development data if needed");
  seedDevelopmentData(db);
  logStartup("Development seed step complete");

  const electrobunRuntime = await loadElectrobunRuntime();

  logStartup("Creating workspace RPC request handlers");
  const requestHandlers = createWorkspaceRpcRequestHandlers(db);

  if (!electrobunRuntime) {
    throw new Error(
      'Electrobun runtime is not available. Launch ChattyPad through "electrobun dev" (or "npm run start"), not plain "bun run".'
    );
  }

  let mainWindow: any;

  let isMaximized = false;

  logStartup("Defining Electrobun RPC bridge");
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
  mainWindow = new electrobunRuntime.BrowserWindow({
    url: "views://renderer/index.html",
    html: null,
    preload: null,
    renderer: "cef",
    rpc,
    title: "ChattyPad",
    frame: {
      x: 0,
      y: 0,
      width: 1200,
      height: 800,
    },
    titleBarStyle: "hiddenInset",
    // @ts-ignore: inject styleMask to force resizable frameless window if supported
    styleMask: {
      Borderless: true,
      Resizable: true,
      Titled: true,
      Closable: true,
      Miniaturizable: true,
    },
    transparent: false,
    navigationRules: null,
    sandbox: false,
  });
  logStartup("BrowserWindow created");
}

bootstrap().catch((err) => {
  logStartupError("Fatal error during bootstrap", err);
  console.error("Fatal error during bootstrap:", err);
  process.exit(1);
});
