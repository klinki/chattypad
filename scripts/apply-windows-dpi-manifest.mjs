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

const iconPath = path.resolve("assets", "icon.ico");
if (!fs.existsSync(iconPath)) {
  throw new Error(`Windows icon file not found: ${iconPath}`);
}

const executableNames = new Set(["launcher", "launcher.exe", "bun", "bun.exe"]);
const targets = [];

for (const entry of walk(buildDir)) {
  const baseName = path.basename(entry).toLowerCase();
  if (executableNames.has(baseName) || baseName.endsWith("-setup.exe")) {
    targets.push(entry);
  }
}

if (targets.length === 0) {
  console.warn(`[dpi-manifest] No Windows executables found under ${buildDir}`);
  process.exit(0);
}

for (const exePath of targets) {
  console.log(`[dpi-manifest] Embedding manifest and icon into ${exePath}`);
  await rcedit(exePath, {
    "application-manifest": manifestPath,
    icon: iconPath,
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
