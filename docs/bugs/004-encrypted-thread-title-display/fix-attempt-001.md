# Fix Attempt 001: Asynchronous Snapshot with In-Memory Decryption

## Goal
Resolve the issue where raw encrypted thread titles are displayed in the sidebar for unlocked projects.

## Proposed Change
- **Async Refactor**: Make `buildWorkspaceSnapshot` and all backend IPC handlers asynchronous.
- **Decryption logic**: Update `buildWorkspaceSnapshotWithActiveThread` to decrypt thread titles using session keys if the project is unlocked.
- **Frontend Stability**: Add optional chaining and defensive guards in `WorkspaceScreen` to handle initial null states and transient data.

## Risks
- Potential UI flickers during async loading (handled by `isLoading` state).

## Files Involved
- `src/main/app/workspace-service.ts`
- `src/main/ipc/workspace-ipc.ts`
- `src/renderer/features/workspace/workspace-screen.tsx`

## Actual Implementation Summary
- Refactored entire backend chain to be `async/await`.
- Added defensive rendering logic in `WorkspaceScreen`.

## Outcome
Thread titles now display correctly as decrypted strings in the sidebar.
