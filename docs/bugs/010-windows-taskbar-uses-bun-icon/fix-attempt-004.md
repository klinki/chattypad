# Fix Attempt 004

## Goal

Make the Windows title-bar icon readable by generating a Windows ICO with a distinct small-size bubble frame instead of downscaling the full app logo uniformly.

## Proposed Change

- Generate 16px and 32px Windows icon frames from a crop of the chat bubble portion of the artwork.
- Keep larger icon sizes based on the full ChattyPad logo.
- Rebuild the launcher and dev bundle so Windows picks up the new ICO contents.

## Risks

- The new bubble crop could be too different from the brand mark if it is over-simplified.
- Windows may still cache an older icon until the shell refreshes, even if the binary is updated correctly.

## Files And Components

- `scripts/generate-icon-ico.mjs`
- `assets/icon.ico`
- `docs/bugs/010-windows-taskbar-uses-bun-icon/initial-findings.md`

## Verification Plan

- Run `npm run build:icon`.
- Run `npm run lint`.
- Run `npm run build`.
- Inspect the launcher EXE icon extracted from the dev bundle.

## Implementation Summary

- Changed `scripts/generate-icon-ico.mjs` so the Windows ICO now uses bubble-focused 16px and 32px frames, while larger frames still come from the full logo.
- Regenerated `assets/icon.ico` from the updated script.

## Test Results

- `npm run build:icon` passed and rewrote `assets/icon.ico`.
- `npm run lint` passed.
- `npm run build` passed.
- The built `launcher.exe` icon extracted from the dev bundle now shows the bubble mark instead of the generic page/window frame.

## Outcome

- The Windows icon asset now has a readable small-size frame and fixed the launcher/taskbar icon.
- This did not fully resolve the live window title-bar icon.

## Remaining Gaps

- Need a live Windows restart of `npm run start` after the HWND-level fix to confirm the title bar now shows the bubble frame.
