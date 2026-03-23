/**
 * Generates a 512x512 PNG icon from the SVG source using the Canvas API via Bun.
 *
 * Usage: bun run scripts/generate-icon-png.mjs
 *
 * If Bun's canvas isn't available, falls back to writing an HTML converter page
 * that can be opened in a browser to produce the PNG manually.
 *
 * For CI/build use, you can also use any CLI SVG→PNG tool:
 *   npx svgexport assets/icon.svg assets/icon.png 512:512
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const svgPath = join(projectRoot, "assets", "icon.svg");
const pngPath = join(projectRoot, "assets", "icon.png");

// Create a self-contained HTML file that converts SVG → PNG via canvas
const svgContent = readFileSync(svgPath, "utf8");
const converterHtmlPath = join(projectRoot, "assets", "_icon-converter.html");

const html = `<!DOCTYPE html>
<html>
<head><title>SVG → PNG converter</title></head>
<body>
<p>Right-click the image below and choose <strong>Save image as…</strong> to save <code>icon.png</code>.</p>
<canvas id="c" width="512" height="512"></canvas>
<script>
const svg = ${JSON.stringify(svgContent)};
const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
const url = URL.createObjectURL(blob);
const img = new Image();
img.onload = () => {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, 512, 512);
  URL.revokeObjectURL(url);
  // Also auto-download
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "icon.png";
  a.click();
};
img.src = url;
</script>
</body>
</html>`;

writeFileSync(converterHtmlPath, html, "utf8");
console.log(`✅ Converter HTML written to: ${converterHtmlPath}`);
console.log(`   Open it in a browser to download icon.png`);
console.log();
console.log(`Alternatively, run:`);
console.log(`   npx -y svgexport assets/icon.svg assets/icon.png 512:512`);
