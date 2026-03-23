# Fix Attempt 001

## Goal
- Preserve the sidebar when recoverable errors occur after the workspace snapshot has already loaded.

## Proposed Change
- Teach `WorkspaceShell` to distinguish between startup/full-shell failures and in-session recoverable errors that should only replace the main pane.
- Add a small testable helper for that shell-layout decision.
- Add regression coverage for the loaded-workspace error path.

## Risks
- If the shell-state rule is too broad, some true fatal errors could keep showing stale sidebar content.
- The change must not interfere with the existing loading-screen behavior before the first snapshot arrives.

## Files And Components
- `src/renderer/components/workspace-shell.tsx`
- `tests/unit/*` coverage for shell state

## Verification Plan
- Run focused unit tests for the shell-state decision logic.
- Run `npm run lint`.

## Implementation Summary
- Added `workspace-shell-state.ts` to distinguish between initial full-shell failures and recoverable in-session errors after a snapshot has already loaded.
- Updated `WorkspaceShell` to keep rendering the sidebar and show `ErrorState` only in the main pane when the workspace snapshot is still available.
- Updated `WorkspaceScreen` to pass `hasSnapshot` into the shell so the render decision has the necessary state.
- Added regression coverage for the shell render-mode decision.

## Test Results
- `bun test tests/unit/workspace-shell-state.test.ts` ✅
- `npm run lint` ✅

## Outcome
- Local verification passed. Waiting for user confirmation in the running app.

## Remaining Gaps
- Need user confirmation that the sidebar remains visible after reproducing the previous broken state.
