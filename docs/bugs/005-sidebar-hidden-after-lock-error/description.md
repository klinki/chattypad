# Bug Description

## Title
Sidebar disappears after a recoverable locked-project error

## Status
- open

## Reported Symptoms
- After repeated clicking across projects and threads, the app can enter a state where the sidebar is no longer visible.
- The main pane shows a centered recoverable error such as `PROJECT_LOCKED`, leaving no visible navigation path back to the workspace.

## Expected Behavior
- Recoverable operation errors should not remove the sidebar when the workspace snapshot is already loaded.
- Users should still be able to navigate to a different project or thread after hitting a locked-project action error.

## Actual Behavior
- `WorkspaceShell` replaces the entire two-pane layout with a full-screen error state for any non-null `error`, even when the renderer still has a valid snapshot.
- This hides the sidebar and makes the app appear stuck until some external recovery path occurs.

## Reproduction Details
1. Load a workspace that contains encrypted and unlocked/locked projects.
2. Trigger an operation that can return `PROJECT_LOCKED` after the snapshot is already loaded, such as interacting with a locked project/thread path.
3. Observe that the main pane shows a recoverable error and the sidebar is no longer rendered.

## Affected Area
- Renderer layout: `src/renderer/components/workspace-shell.tsx`
- Renderer controller/store error flow: `src/renderer/features/workspace/workspace-controller.ts`, `src/renderer/state/workspace-store.ts`

## Constraints
- Fatal startup failures should still be able to render a full-screen error state.
- The fix should preserve the existing lock screen behavior for active locked projects.

## Open Questions
- Which exact user interaction path most reliably produces the `PROJECT_LOCKED` error in the running app.
