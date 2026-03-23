# Bug: Encrypted thread title displayed in sidebar

**Status**: Open
**Priority**: Medium

## Symptoms
When a user creates a new thread in an encrypted project, the sidebar displays the raw encrypted Base64 string (e.g., `XxaBKUONWpTwuMkqqnar...`) instead of the decrypted title.

## Expected Behavior
The sidebar should display the decrypted title (e.g., "New thread") for encrypted projects if the project is unlocked.

## Actual Behavior
The `WorkspaceSnapshot` sent to the renderer contains raw encrypted thread titles because `buildWorkspaceSnapshot` does not perform decryption.

## Reproduction Details
1. Create or unlock an encrypted project.
2. Click the "+" button to create a new thread.
3. Observe the thread title in the sidebar.

## Affected Area
- Backend: `src/main/app/workspace-service.ts` (`buildWorkspaceSnapshotWithActiveThread`)

## Open Questions
- Does `updateThread` also store/return raw encrypted strings incorrectly?
