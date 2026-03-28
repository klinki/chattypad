import { createRequire } from "node:module";
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

export default {
  app: {
    name: "chattypad",
    identifier: identifierByEnvironment[buildEnvironment] ?? identifierByEnvironment.dev,
    version,
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
    },
    views: {
      renderer: {
        entrypoint: "src/renderer/main.ts",
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
    },
    win: {
      bundleCEF: false,
    },
  },
  scripts: {
    postBuild: "scripts/apply-windows-dpi-manifest.mjs",
  },
} satisfies ElectrobunConfig;
