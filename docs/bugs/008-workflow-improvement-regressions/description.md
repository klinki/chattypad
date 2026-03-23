# Bug Description

## Title
Workflow improvement can skip inline naming focus and fail to open the encrypted-project dialog

## Status
- open

## Reported Symptoms
- After using the fast project creation flow beyond the first project, the UI can show the new thread in inline edit mode while keyboard focus is already in the message composer.
- The workflow can effectively auto-accept the default names because the composer becomes active before the user confirms the project and thread names.
- The long-press create menu can show the "Create new encrypted project" action without reliably opening the dialog afterward.

## Expected Behavior
- Fast plain-project creation should keep focus in the inline project name input until the user presses `Enter`.
- After confirming the project name, the newly created thread should enter inline rename mode and keep keyboard focus there until the user presses `Enter`.
- Only after confirming the thread name should the main message composer gain focus.
- Selecting "Create new encrypted project" from the long-press menu should always open the encrypted-project dialog.

## Actual Behavior
- Snapshot application during the workflow can reopen an active thread in the main pane before inline naming is complete.
- This leaves the sidebar editor visible while the message composer is active.
- The encrypted-project dialog path is still fragile around menu dismissal and overlay ordering.

## Reproduction Details
1. Open a workspace with at least one existing project and thread.
2. Short-click the sidebar `+` button to create another plain project.
3. Confirm the project name and observe the next thread rename step.
4. Type and note that the message composer, not the inline thread input, receives focus.
5. Long-press the sidebar `+` button and choose `Create new encrypted project`.
6. Observe that the dialog may fail to appear.

## Affected Area
- `src/renderer/features/workspace/workspace-controller.ts`
- `src/renderer/features/workspace/workspace-screen.tsx`
- `src/renderer/components/sidebar.tsx`

## Constraints
- Normal explicit thread selection should still open the thread immediately.
- The fast workflow should remain mouse-light: one click to start, then keyboard-only confirmation.
- Existing encrypted-project creation and rename flows must keep working.

## Open Questions
- Whether the controller-level snapshot options are sufficient for all future workflow steps, or whether the IPC contract should eventually expose a dedicated "do not activate thread" mode.
