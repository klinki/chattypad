# Initial Findings

## Confirmed Facts
- `WorkspaceShell` currently renders only `ErrorState` whenever `error` is non-null.
- The shell-wide error branch does not render `sidebar`, even if `snapshot` data is still available in the renderer store.
- Many controller actions call `workspaceStore.setError(...)` for recoverable operation failures, including `PROJECT_LOCKED`.
- `workspaceStore.setError(...)` does not clear the current snapshot, so the renderer still has enough data to keep navigation visible.

## Likely Cause
- Recoverable, in-session operation errors are treated the same as startup-level workspace failures, so the shell tears down the sidebar unnecessarily.

## Unknowns
- The most reliable manual reproduction path for this specific screenshot.
- Whether any recoverable errors besides `PROJECT_LOCKED` should continue to occupy the full main pane after the fix.

## Reproduction Status
- Reproduced by code-path inspection and consistent with the provided screenshot showing a recoverable `PROJECT_LOCKED` error without a sidebar.

## Evidence Gathered
- `src/renderer/components/workspace-shell.tsx`: `if (error) { return <div style={containerStyle}><ErrorState ... /></div>; }`
- `src/renderer/features/workspace/workspace-controller.ts`: most failed actions call `workspaceStore.setError(result.error)`.
- `src/renderer/state/workspace-store.ts`: `setError(...)` updates `error` but preserves `snapshot`.
