# Fix Attempt 003

## Goal

Force the Windows title-bar icon to be applied before the native window is shown, so the `npm run start` path does not paint the generic Windows glyph first.

## Proposed Change

- Create the Windows window hidden.
- Apply the branded icon through Electrobun's native `setWindowIcon` call.
- Show the window only after the icon has been set.

## Risks

- Delaying the initial show on Windows could slightly alter perceived startup behavior.
- If the native icon setter is a no-op or only updates one icon slot, the visible result may still be generic.

## Files And Components

- `src/main/app/main.ts`
- `docs/bugs/010-windows-taskbar-uses-bun-icon/fix-attempt-002.md`

## Verification Plan

- Run `npm run lint`.
- Run `npm run build`.
- Reproduce with `npm run start` on Windows and check the title-bar icon.

## Implementation Summary

- Added a hidden-before-show startup path on Windows and re-applied the native `setWindowIcon` call.
- This did not change the visible Windows title-bar icon.

## Test Results

- `npm run lint` passed.
- `npm run build` passed.
- The runtime hook was reached, but the title-bar icon still rendered as the generic-looking small frame.

## Outcome

- This attempt did not solve the icon issue. The runtime path was not the missing piece.

## Remaining Gaps

- Need a fresh Windows run after the icon asset change to confirm the title-bar icon now matches the bubble frame.
