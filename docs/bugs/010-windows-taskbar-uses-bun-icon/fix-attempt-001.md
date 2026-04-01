# Fix Attempt 001

## Goal

Make Electrobun use a Windows ICO resource so the taskbar and app executable show the ChattyPad icon instead of the Bun fallback.

## Proposed Change

- Generate `assets/icon.ico` from the existing app artwork.
- Update `electrobun.config.ts` so `build.win.icon` points to the ICO file.
- Keep `linux.icon` on the PNG path.

## Risks

- The generated ICO could omit sizes Windows prefers if the conversion is wrong.
- If Windows icon cache is stale, local validation may still show the old icon until the cache is refreshed.

## Files And Components

- `electrobun.config.ts`
- `assets/icon.ico`
- optional icon-generation helper script if needed

## Verification Plan

- Confirm the generated ICO exists and is non-empty.
- Run `npm run lint`.
- Rebuild the app and inspect the Windows release output paths.

## Implementation Summary

- Added a committed Windows ICO at `assets/icon.ico`, generated from the existing artwork.
- Updated `electrobun.config.ts` so `build.win.icon` points to the ICO instead of the PNG.
- Added `scripts/generate-icon-ico.mjs` and a `build:icon` package script to regenerate the Windows icon from the tracked PNG source.
- Hardened `scripts/apply-windows-dpi-manifest.mjs` so the post-build hook also reapplies the ICO to the stable Windows launcher and setup wrapper.

## Test Results

- `npm run build:icon` succeeded and rewrote `assets/icon.ico`.
- `npm run lint` passed.
- `bun run build:stable` completed successfully after the icon changes.
- The post-build script successfully targeted the Windows launcher and setup wrapper with both the manifest and icon.
- Electrobun still logs an internal `rcedit` path warning during its own icon step, but the local post-build hook now patches the correct files afterward.

## Outcome

- The Windows build pipeline now has an explicit `.ico` asset and a fallback post-build icon patch, which should stop Windows from falling back to the Bun taskbar icon.

## Remaining Gaps

- The final confirmation still needs to come from a real Windows taskbar check because Windows icon caching can lag behind a rebuild.
