# Fix Attempt 002

## Goal
- Make decrypted thread titles appear in the sidebar immediately after unlock and keep the snapshot lock state consistent with the current session.

## Proposed Change
- Update the renderer store so `setActiveThread` synchronizes the full active thread summary, including `title`, back into `snapshot.threadsByProject`.
- Refresh the workspace snapshot after unlock and lock actions so sidebar metadata reflects the current main-process session keys.
- Add a regression test that proves decrypted titles replace placeholder sidebar entries when an active thread detail is applied.

## Risks
- Reloading the snapshot during unlock/lock could reset transient UI state if the controller sequence is wrong.
- Store synchronization must avoid dropping thread rows when the active thread is not already present in the snapshot.

## Files And Components
- `src/renderer/state/workspace-store.ts`
- `src/renderer/features/workspace/workspace-controller.ts`
- `tests/unit/workspace-store.test.ts`

## Verification Plan
- Run a focused unit test covering decrypted title propagation into `threadsByProject`.
- Run TypeScript linting to catch contract or control-flow regressions.

## Implementation Summary
- Updated `workspaceStore.setActiveThread(...)` to write the full active-thread summary, including `title`, back into `snapshot.threadsByProject`.
- Updated the renderer unlock flow to reload the workspace snapshot after a successful unlock so all thread rows refresh from the main-process decrypted snapshot.
- Updated encrypted thread renames in `workspace-service.ts` to encrypt titles before storing them.
- Added a legacy plaintext-title fallback for unlocked encrypted projects so older bad rows render as their plaintext title instead of the placeholder.
- Added regression tests for renderer-store synchronization and encrypted-thread title handling.

## Test Results
- `bun test` ✅
- `npm run lint` ✅

## Outcome
- Fixed. User confirmed in the desktop app on 2026-03-23 that the sidebar title now updates correctly after unlock.

## Remaining Gaps
- None recorded.
