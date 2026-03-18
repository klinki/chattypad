import fs from "fs";
import path from "path";
import rcedit from "rcedit";

const targetOs = process.env["ELECTROBUN_OS"];
if (targetOs !== "win") {
  process.exit(0);
}

const buildDir = process.env["ELECTROBUN_BUILD_DIR"];
if (!buildDir) {
  throw new Error("ELECTROBUN_BUILD_DIR is not set.");
}

const manifestPath = path.resolve("scripts", "windows-dpi-awareness.manifest");
if (!fs.existsSync(manifestPath)) {
  throw new Error(`Manifest file not found: ${manifestPath}`);
}

const executableNames = new Set(["launcher.exe", "bun.exe"]);
const targets = [];

for (const entry of walk(buildDir)) {
  if (executableNames.has(path.basename(entry).toLowerCase())) {
    targets.push(entry);
  }
}

if (targets.length === 0) {
  console.warn(`[dpi-manifest] No Windows executables found under ${buildDir}`);
  process.exit(0);
}

for (const exePath of targets) {
  console.log(`[dpi-manifest] Embedding manifest into ${exePath}`);
  await rcedit(exePath, {
    "application-manifest": manifestPath,
    "requested-execution-level": "asInvoker",
  });
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }

    yield fullPath;
  }
}
