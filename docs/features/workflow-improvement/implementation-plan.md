# Workflow Improvement Implementation Plan

## Path
- `docs/features/workflow-improvement/implementation-plan.md`

## Summary
- Move plain project creation back to an inline-first workflow, push encrypted project creation behind a right-click menu, and chain project naming into thread naming and then composer focus.

## Implementation Areas

### Sidebar Creation Control
- Use right click on the sidebar `+` button to open the project-type menu.
- Reuse the existing custom context menu for the right-click options.
- Keep short click as the fast plain-project path.

### Plain Project Fast Path
- Replace the short-click project dialog launch with immediate plain-project creation using a placeholder name.
- Store workflow state in `WorkspaceScreen` so the app knows the newly created project should chain into thread creation once the name is committed.

### Encrypted Project Detailed Path
- Keep the existing dialog-based encrypted creation flow.
- Refine dialog keyboard handling so `Enter` confirms and `Escape` cancels.

### Thread Follow-Up Workflow
- Detect when a thread rename completes for a workflow-created thread.
- After a successful rename, move focus into the active thread’s message composer.

## Files Expected To Change
- `src/renderer/components/sidebar.tsx`
- `src/renderer/features/workspace/workspace-screen.tsx`
- `src/renderer/components/message-composer.tsx`
- `tests/unit/*` for focused workflow regressions where practical

## Verification
- `npm run lint`
- Focused renderer/controller tests for workflow state transitions where possible
- Manual check of the end-to-end fast path:
  1. Short click `+`
  2. Name project and press `Enter`
  3. Name thread and press `Enter`
  4. Composer receives focus
