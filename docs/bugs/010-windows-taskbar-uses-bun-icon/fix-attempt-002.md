# Fix Attempt 002

## Goal

Set the Windows title-bar icon during app startup so `npm run start` no longer shows the generic Windows app glyph.

## Proposed Change

- Add a Windows-only helper in the main process that resolves the branded `.ico` file.
- Call Electrobun's native `setWindowIcon` API after the `BrowserWindow` is created, before the window is shown.
- Search both dev and packaged icon locations so the same code works in local startup and packaged runs.

## Risks

- The deep import into Electrobun's internal native module could be brittle if the package layout changes.
- If the native icon call needs a different path or timing, the window may still fall back to the default glyph.
- Hiding the window briefly on Windows could change startup feel slightly, but should not affect functionality.

## Files And Components

- `src/main/app/main.ts`
- `docs/bugs/010-windows-taskbar-uses-bun-icon/description.md`
- `docs/bugs/010-windows-taskbar-uses-bun-icon/initial-findings.md`

## Verification Plan

- Run `npm run lint`.
- Run a focused Windows startup path check with `npm run start` or the closest available local equivalent.
- Confirm the title-bar icon uses the ChattyPad asset instead of the generic Windows glyph.

## Implementation Summary

- Added a Windows-only runtime helper in `src/main/app/main.ts` that looks for the branded ICO in both dev and packaged locations.
- Imported Electrobun's internal native module and called `setWindowIcon` immediately after `BrowserWindow` creation, then showed the window on Windows.
- Kept the taskbar/install packaging changes from the previous attempt intact.

## Test Results

- `npm run lint` passed after the runtime icon hook was added.
- `npm run build` completed successfully and bundled the deep Electrobun native import.
- The build still logs Electrobun's existing `rcedit` path warnings, but those are unrelated to the runtime icon hook and were already present in earlier build work.
- The startup log confirms the runtime icon hook is reached and reports `Applied Windows window icon`.

## Outcome

- The app now attempts to apply the branded window icon at runtime, which should cover the `npm run start` case where the title bar was still falling back to the generic Windows glyph.

## Remaining Gaps

- Need confirmation from a real Windows startup that the title-bar icon changes in the dev runner as well as the packaged build.
