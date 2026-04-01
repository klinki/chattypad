/**
 * Generates a Windows ICO file from the existing PNG icon source.
 *
 * Usage: node scripts/generate-icon-ico.mjs
 *
 * The Windows Electrobun icon path expects an .ico file so the launcher,
 * installer wrapper, and taskbar can all use a native executable icon.
 */
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import pngToIco from "png-to-ico";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");
const { resize } = require("png-to-ico/lib/png");

const pngPath = new URL("../assets/icon.png", import.meta.url);
const icoPath = new URL("../assets/icon.ico", import.meta.url);

const png = await readFile(pngPath);
const source = PNG.sync.read(png);
const bubbleCrop = cropPNG(source, 220, 220, 260, 260);

const small16 = PNG.sync.write(resize(bubbleCrop, 16, 16));
const small32 = PNG.sync.write(resize(bubbleCrop, 32, 32));
const medium48 = PNG.sync.write(resize(source, 48, 48));
const large256 = PNG.sync.write(resize(source, 256, 256));

const ico = await pngToIco([small16, small32, medium48, large256]);

await writeFile(icoPath, ico);
console.log(`Wrote ${icoPath.pathname} (${ico.length} bytes)`);

function cropPNG(image, x, y, width, height) {
  const cropped = new PNG({ width, height });

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const sourceX = x + col;
      const sourceY = y + row;
      const sourceIndex = (sourceY * image.width + sourceX) << 2;
      const targetIndex = (row * width + col) << 2;

      cropped.data[targetIndex] = image.data[sourceIndex];
      cropped.data[targetIndex + 1] = image.data[sourceIndex + 1];
      cropped.data[targetIndex + 2] = image.data[sourceIndex + 2];
      cropped.data[targetIndex + 3] = image.data[sourceIndex + 3];
    }
  }

  return cropped;
}
