# Initial Findings

## Confirmed Facts
- `workspace-controller.ts` currently reopens an active thread whenever a snapshot resolves an `activeThreadId`.
- The fast workflow reuses `createProject`, `updateProject`, and `createThread`, all of which currently apply snapshots with the default "open active thread" behavior.
- `workspace-screen.tsx` starts inline editing after those controller calls return, so the sidebar editor can race with a newly reopened main-pane composer.
- The encrypted-project dialog path already defers opening with `setTimeout(...)`, but the modal overlay does not currently establish a higher stacking order than the context menu.

## Likely Cause
- The renderer treats workflow snapshots like normal navigation snapshots, so the old or newly created active thread is reopened before the inline rename workflow is complete.
- The encrypted-project dialog path still depends on menu close timing and lacks a strong z-index guarantee.

## Unknowns
- Whether any residual focus issues remain after preventing thread activation during workflow-only snapshot updates.

## Reproduction Status
- Reproduced by code-path inspection and consistent with the user screenshot showing a visible inline thread editor while the composer is active.

## Evidence Gathered
- `src/renderer/features/workspace/workspace-controller.ts`: `applySnapshot(...)` always calls `openThread(...)` when an active thread id is available.
- `src/renderer/features/workspace/workspace-screen.tsx`: fast project creation immediately chains into thread creation using the same controller methods as normal navigation.
- `src/renderer/components/message-composer.tsx`: the composer can still retain or regain focus once the main pane is reopened.
- `src/renderer/components/context-menu.tsx`: the create menu renders at `zIndex: 1000`; the project dialog overlay has no explicit z-index.
