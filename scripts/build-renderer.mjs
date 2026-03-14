import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(import.meta.dirname, "..");
const entryFile = resolve(repoRoot, "src/renderer/main.ts");
const outDir = resolve(repoRoot, "dist/renderer");
const htmlSource = resolve(repoRoot, "src/renderer/index.html");
const htmlTarget = resolve(outDir, "index.html");

mkdirSync(outDir, { recursive: true });

const buildResult = spawnSync(
  "bun",
  ["build", entryFile, "--outdir", outDir, "--target", "browser"],
  {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  }
);

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

if (!existsSync(dirname(htmlTarget))) {
  mkdirSync(dirname(htmlTarget), { recursive: true });
}

cpSync(htmlSource, htmlTarget);
