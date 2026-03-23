# Bug Description

## Title
Encrypted project threads stay on `[Encrypted content]` in the sidebar after unlock

## Status
- open

## Reported Symptoms
- In encrypted projects, thread rows in the sidebar keep showing the encrypted placeholder after the project has been unlocked.
- The active thread can be opened successfully, but the sidebar title does not recover to the decrypted title.

## Expected Behavior
- Unlocking an encrypted project should update the visible thread list so decrypted titles are shown anywhere the user can see that project.

## Actual Behavior
- The main process can decrypt thread titles during `thread:open`, but the renderer store keeps the old sidebar snapshot entry because it only syncs `lastMessageAt` back into `threadsByProject`.
- Unlocking also does not refresh the workspace snapshot, so `ProjectSummary.isLocked` and any placeholder titles remain stale until another full snapshot-producing action happens.

## Reproduction Details
1. Open a workspace with an encrypted project that contains at least one thread.
2. Select a thread while the project is locked so the renderer has placeholder title data.
3. Unlock the project.
4. Observe that the thread header can use decrypted data, but the sidebar row can remain `[Encrypted content]`.

## Affected Area
- Renderer state: `src/renderer/state/workspace-store.ts`
- Renderer controller: `src/renderer/features/workspace/workspace-controller.ts`
- Unlock/open-thread synchronization between renderer and main process

## Constraints
- Encrypted content must remain hidden while the project is locked.
- Fix should not require a full app reload to refresh decrypted titles.

## Open Questions
- Whether rename/update flows for encrypted thread titles also need to encrypt on write.
