# Initial Findings

## Confirmed Facts
- The lock icon in `sidebar.tsx` is currently rendered as a plain `div` with no click handler.
- `WorkspaceScreen` only exposes unlock UI through the main-pane `LockScreen`.
- `createWorkspaceController.unlockProject(...)` currently stores recoverable unlock failures in the global workspace error state.
- A global unlock error would remove modal-style unlock UI because `WorkspaceShell` can replace main content with an error view.

## Likely Cause
- The sidebar never wired the locked-project icon to an unlock action, and the existing unlock flow is too coupled to the main-pane lock screen.

## Unknowns
- Whether any other sidebar interactions should also route into the same unlock dialog.

## Reproduction Status
- Reproduced by code inspection. The lock indicator has no interactive behavior today.

## Evidence Gathered
- `src/renderer/components/sidebar.tsx`: locked/unlocked icon uses a non-interactive `div`.
- `src/renderer/features/workspace/workspace-screen.tsx`: unlock prompt is only shown via `LockScreen` for the active locked project.
- `src/renderer/features/workspace/workspace-controller.ts`: unlock failures call `workspaceStore.setError(...)`.
