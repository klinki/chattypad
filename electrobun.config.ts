import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import type { ElectrobunConfig } from "electrobun";

const require = createRequire(import.meta.url);
const { version } = require("./package.json") as { version: string };
const buildEnvironment = (() => {
  const envArg =
    process.argv.find((arg) => arg.startsWith("--env="))?.split("=")[1] || "dev";

  return ["dev", "canary", "stable"].includes(envArg) ? envArg : "dev";
})();

const identifierByEnvironment: Record<string, string> = {
  dev: "chattypad.electrobun.dev",
  canary: "chattypad.electrobun.canary",
  stable: "chattypad.electrobun.stable",
};

function getGitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

const buildDate = new Date().toISOString();
const buildInfoDefines = {
  __CHATTYPAD_APP_VERSION__: JSON.stringify(version),
  __CHATTYPAD_GIT_COMMIT__: JSON.stringify(getGitCommit()),
  __CHATTYPAD_BUILD_DATE__: JSON.stringify(buildDate),
};

export default {
  app: {
    name: "chattypad",
    identifier: identifierByEnvironment[buildEnvironment] ?? identifierByEnvironment.dev,
    version,
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
      define: buildInfoDefines,
    },
    views: {
      renderer: {
        entrypoint: "src/renderer/main.ts",
        define: buildInfoDefines,
      },
    },
    copy: {
      "src/renderer/index.html": "views/renderer/index.html",
    },
    mac: {
      bundleCEF: false,
    },
    linux: {
      bundleCEF: false,
      icon: "assets/icon.png",
    },
    win: {
      bundleCEF: false,
      icon: "assets/icon.ico",
    },
  },
  scripts: {
    postBuild: "scripts/apply-windows-dpi-manifest.mjs",
  },
} satisfies ElectrobunConfig;
