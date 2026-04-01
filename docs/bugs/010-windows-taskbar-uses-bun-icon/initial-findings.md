# Initial Findings

## Confirmed Facts

- `electrobun.config.ts` currently points both `linux.icon` and `win.icon` at `assets/icon.png`.
- Electrobun's Windows config docs state that the Windows icon path should be an `.ico` file.
- The repository already contains `assets/icon.svg` and `assets/icon.png`, but no `assets/icon.ico`.
- The Windows release workflow and build output already produce a packaged app, so this looks like an icon-resource issue rather than a general packaging failure.
- `npm run start` runs `electrobun dev`, and the live `BrowserWindow` constructor in ChattyPad does not expose an icon option.
- Electrobun's native FFI layer exposes `setWindowIcon`, so the title-bar glyph appears to be a separate runtime concern from the packaged taskbar icon.
- The generated Windows ICO originally downscaled the full logo, and the 16px frame rendered as a generic page/window mark.
- A bubble-focused 16px frame produces a much more legible title-bar icon when extracted from the built launcher.

## Likely Cause

- Windows is probably not consuming the PNG as a valid executable/taskbar icon resource, so it falls back to the default Bun icon.
- The window chrome icon is probably never being applied during dev startup, so Windows uses its generic fallback even when the taskbar icon is branded.
- The small Windows icon frame was too detailed, so the title bar fell back to a visually generic-looking tiny rendering.

## Unknowns

- Whether the Windows taskbar is reading the launcher executable icon, the installer wrapper icon, or both.
- Whether Windows icon caching is masking a fixed build locally.
- Whether calling the native window-icon setter after `BrowserWindow` creation is sufficient in both dev and packaged runs.

## Reproduction Status

- Confirmed by code inspection.
- Not yet validated with a rebuilt Windows artifact.

## Evidence Gathered

- `node_modules/electrobun/dist/api/bun/ElectrobunConfig.ts` documents Windows `icon` as `.ico`.
- `electrobun.config.ts` currently uses `assets/icon.png` for Windows.
- The repo has only PNG/SVG icon sources at the moment.
- `node_modules/electrobun/dist/api/bun/core/BrowserWindow.ts` has no icon option on the window constructor.
- `node_modules/electrobun/dist/api/bun/proc/native.ts` includes `setWindowIcon` in the native symbol table.
- The extracted `launcher.exe` icon now shows the bubble mark once the ICO generator uses distinct small-size frames.
