# Fix Attempt 005

## Goal

Set the Windows title-bar icon directly on the native HWND so the live window chrome matches the corrected launcher icon.

## Proposed Change

- Use `user32.dll` to load the branded ICO as an `HICON`.
- Send `WM_SETICON` for both the small and big window icon slots.
- Set the class icon fields as a fallback for the title bar and taskbar.

## Risks

- The window handle type from Electrobun may not be a raw HWND on every build path.
- Windows could still cache the old caption icon until the shell refreshes.

## Files And Components

- `src/main/app/main.ts`
- `docs/bugs/010-windows-taskbar-uses-bun-icon/fix-attempt-004.md`

## Verification Plan

- Run `npm run lint`.
- Run `npm run build`.
- Re-test `npm run start` on Windows and inspect the title bar icon.

## Implementation Summary

- Added a direct Win32 icon helper in `src/main/app/main.ts` that loads the branded ICO with `LoadImageA` and applies it to the window with `WM_SETICON` and class icon calls.
- Kept the Electrobun runtime icon helper as an additional fallback.

## Test Results

- `npm run lint` passed.
- `npm run build` passed.
- The build still reports Electrobun's bundled `rcedit` path warnings, but those are separate from the HWND icon path and were already present.

## Outcome

- The app now writes the icon to the native window handle directly, which is the correct layer for the title bar.

## Remaining Gaps

- Need a live Windows confirmation that the title bar now uses the same bubble icon as the launcher.
