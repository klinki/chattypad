# Fix Attempt 001

## Goal
- Make the locked-project icon in the sidebar open an unlock prompt that can successfully unlock the project.

## Proposed Change
- Replace the static locked icon with a button that opens a dedicated unlock dialog for the selected project.
- Keep recoverable unlock failures local to the unlock UI so the user can retry without losing context.
- Reuse the same controller unlock path for both the lock screen and the sidebar dialog.

## Risks
- Unlock error handling changes could alter the existing lock-screen behavior if success and failure paths are not separated carefully.
- The icon button must not interfere with drag-and-drop or row-level interactions in the sidebar.

## Files And Components
- `src/renderer/components/sidebar.tsx`
- `src/renderer/features/workspace/workspace-screen.tsx`
- `src/renderer/features/workspace/workspace-controller.ts`

## Verification Plan
- Add focused unit coverage around recoverable unlock errors staying local.
- Run `npm run lint`.

## Implementation Summary
- Replaced the locked-project icon in the sidebar with a real button that opens an unlock dialog for that project.
- Added a dedicated unlock dialog in `WorkspaceScreen` and reused the same controller unlock path as the existing lock screen.
- Updated the controller so recoverable unlock failures are returned to the caller instead of being written into the global workspace error state.
- Updated `LockScreen` to display inline unlock errors so both unlock entry points can show retryable failures without losing context.

## Test Results
- `bun test tests/unit/workspace-controller.test.ts` ✅
- `npm run lint` ✅

## Outcome
- Fixed. User confirmed in the desktop app on 2026-03-23 that the sidebar lock icon now opens the unlock prompt and the project unlocks successfully.

## Remaining Gaps
- None recorded.
