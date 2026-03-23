import { createRequire } from "node:module";
import type { ElectrobunConfig } from "electrobun";

const require = createRequire(import.meta.url);
const { version } = require("./package.json") as { version: string };

export default {
  app: {
    name: "chattypad",
    identifier: "chattypad.electrobun.dev",
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
