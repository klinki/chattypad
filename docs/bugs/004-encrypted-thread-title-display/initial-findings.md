# Initial Findings

## Confirmed Facts
- `openThread` in `src/main/app/workspace-service.ts` decrypts the active thread title when a session key exists for the project.
- `buildWorkspaceSnapshotWithActiveThread` also decrypts thread titles, but only when a fresh snapshot is requested after the project is already unlocked.
- `workspaceStore.setActiveThread` updates `activeThread` and only copies `lastMessageAt` into `snapshot.threadsByProject`; it does not copy the decrypted `title`.
- `createWorkspaceController.unlockProject` derives the renderer key and re-opens the active thread, but it does not request a fresh workspace snapshot after unlock.

## Likely Cause
- The decrypted title returned by `thread:open` is dropped at the renderer-store boundary, leaving the sidebar list on the previous placeholder value.
- Because unlock does not reload the snapshot, project lock metadata and any placeholder titles in the sidebar remain stale unless some other action rebuilds the snapshot.

## Unknowns
- Whether encrypted thread renames are stored in plaintext by `updateThread`.
- Whether lock operations should also reload the sidebar snapshot to restore placeholders immediately.

## Reproduction Status
- Reproduced by code-path inspection. The current renderer logic cannot propagate a decrypted title from `ActiveThreadDetail` into the sidebar thread summaries.

## Evidence Gathered
- `src/main/app/workspace-service.ts`: `openThread` decrypts `thread.title` with `CryptoService.decrypt(...)`.
- `src/renderer/state/workspace-store.ts`: `updateActiveThreadSummary(...)` only updates `lastMessageAt`.
- `src/renderer/features/workspace/workspace-controller.ts`: `unlockProject(...)` re-opens the active thread instead of applying a refreshed workspace snapshot.
