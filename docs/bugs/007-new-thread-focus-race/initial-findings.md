# Initial Findings

## Confirmed Facts
- `createThread` on the main process returns a snapshot with the new thread id as `activeThreadId`.
- The renderer controller stores a mutable `intendedThreadId`, but `applySnapshot(...)` immediately overwrites it with `snapshot.activeThreadId`.
- Many unrelated operations also return snapshots, and those snapshots often use the backend default `activeThreadId` instead of the latest renderer-side selection intent.
- `WorkspaceScreen` currently highlights the active thread from `state.activeThread` rather than `snapshot.activeThreadId`.

## Likely Cause
- The controller loses the user’s latest thread intent whenever any later snapshot response arrives with a different `activeThreadId`, creating a race that can redirect focus to another thread.

## Unknowns
- Whether preserving renderer-side thread intent is sufficient for all overlapping action paths without changing the IPC contract.

## Reproduction Status
- Reproduced by code-path inspection and consistent with the reported “clicking a lot” behavior.

## Evidence Gathered
- `src/renderer/features/workspace/workspace-controller.ts`: `applySnapshot(...)` sets `intendedThreadId = snapshot.activeThreadId`.
- `src/main/app/workspace-service.ts`: most snapshot-producing operations call `buildWorkspaceSnapshot(...)`, which can default the active thread.
- `src/renderer/features/workspace/workspace-screen.tsx`: sidebar `activeThreadId` prop is derived from `state.activeThread`.
