/**
 * Main process entry point for the ChattyPad desktop application.
 * Initializes the database, registers IPC handlers, and creates the application window.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { initializeSchema } from "../database/schema.js";
import { getDatabase } from "../database/sqlite.js";
import { seedDevelopmentData } from "../database/seed.js";
import type { WorkspaceElectrobunRpcSchema } from "../../shared/contracts/electrobun-rpc.js";
import {
  createWorkspaceRpcRequestHandlers,
  type WorkspaceRpcRequestHandlers,
} from "../ipc/workspace-ipc.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rendererEntryPath = path.resolve(__dirname, "../../../dist/renderer/index.html");

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
        messages: Record<never, never>;
      };
    }
  ) => unknown;
}

async function loadElectrobunRuntime(): Promise<ElectrobunRuntimeModule | null> {
  try {
    const dynamicImport = new Function(
      "specifier",
      "return import(specifier);"
    ) as (specifier: string) => Promise<ElectrobunRuntimeModule>;

    return await dynamicImport("electrobun/bun");
  } catch {
    return null;
  }
}

function resolveRendererUrl(): string {
  if (!fs.existsSync(rendererEntryPath)) {
    throw new Error(
      `Renderer HTML not found at ${rendererEntryPath}. Run "npm run build" before launching the desktop shell.`
    );
  }

  return pathToFileURL(rendererEntryPath).href;
}

async function bootstrap(): Promise<void> {
  // Initialize the local SQLite database and schema
  const db = getDatabase();
  initializeSchema(db);
  seedDevelopmentData(db);

  const electrobunRuntime = await loadElectrobunRuntime();
  const rendererUrl = resolveRendererUrl();
  const requestHandlers = createWorkspaceRpcRequestHandlers(db);

  if (electrobunRuntime) {
    const rpc = electrobunRuntime.defineElectrobunRPC<WorkspaceElectrobunRpcSchema>(
      "bun",
      {
        handlers: {
          requests: requestHandlers,
          messages: {},
        },
      }
    );

    new electrobunRuntime.BrowserWindow({
      url: rendererUrl,
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
      titleBarStyle: "default",
      transparent: false,
      navigationRules: null,
      sandbox: false,
    });
    console.log(`ChattyPad window created from ${rendererEntryPath}`);
    return;
  }

  console.warn(
    "Electrobun runtime is not installed in this environment. The renderer build was found on disk, but no desktop window was created."
  );
  console.log(`Renderer assets expected at ${rendererEntryPath}`);
}

bootstrap().catch((err) => {
  console.error("Fatal error during bootstrap:", err);
  process.exit(1);
});
