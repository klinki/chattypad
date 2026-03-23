# Fix Attempt 002

## Goal
- Restore reliable encrypted-project dialog opening from the long-press create menu.

## Proposed Change
- Fix the `ProjectDialog` hook ordering so the component does not conditionally skip `useEffect` while closed.
- Keep the existing long-press menu behavior and dialog overlay stacking fix unless investigation shows they are unnecessary.

## Risks
- The dialog keyboard handler must stay scoped to the open state so it does not capture `Enter` and `Escape` while closed.

## Files And Components
- `src/renderer/features/workspace/workspace-screen.tsx`

## Verification Plan
- Run `npm run lint`.
- Manually verify that choosing `Create new encrypted project` from the create menu shows the dialog.

## Implementation Summary
- Fixed `ProjectDialog` so its `useEffect` hook always runs in a stable order and only attaches the keyboard listener while the dialog is open.
- This removes the conditional hook path that could block the encrypted-project dialog from rendering after the menu action changed the dialog state from `closed` to `create-encrypted`.

## Test Results
- `npm run lint` ✅

## Outcome
- Pending user verification.

## Remaining Gaps
- Pending implementation.
