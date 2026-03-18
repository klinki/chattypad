import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "chattypad",
    identifier: "chattypad.electrobun.dev",
    version: "0.1.0",
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
