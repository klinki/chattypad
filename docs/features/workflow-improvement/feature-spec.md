# Workflow Improvement Feature Spec

## Path
- `docs/features/workflow-improvement/feature-spec.md`

## Goal
- Restore the fast plain-project creation workflow while keeping encrypted-project creation available as an explicit edge-case path.
- Reduce mouse clicks between creating a project, creating a thread, naming both, and starting the first note.

## User Experience
- A short click on the sidebar `+` button creates a plain project immediately, puts the project name into inline edit mode, and selects the whole name for fast replacement.
- A long press on the sidebar `+` button opens a context menu with:
  - `Create new project`
  - `Create new encrypted project`
- Choosing `Create new encrypted project` opens the detailed creation dialog.
- The encrypted-project dialog must submit on `Enter` and close on `Escape`.
- After a fast-created project name is committed, the app automatically creates a new thread in that project and focuses inline thread-name editing.
- After the new thread name is committed, focus moves directly into the note editor so the user can start typing the first note immediately.

## Primary Workflow
1. Click `+`.
2. Type the project name and press `Enter`.
3. Type the thread name and press `Enter`.
4. Start typing the note immediately.
5. Press `Enter` to send the note.

## Acceptance Criteria
- A short click on the sidebar `+` button does not open the project dialog.
- The new plain project enters inline edit mode immediately after creation.
- Confirming the project name automatically creates a new thread in that same project.
- The new thread enters inline edit mode immediately after creation.
- Confirming the thread name moves keyboard focus to the note editor for the active thread.
- A long press on the sidebar `+` button opens the creation menu instead of creating a project immediately.
- Selecting `Create new project` from the long-press menu uses the same fast plain-project flow as the short click.
- Selecting `Create new encrypted project` opens the detailed project dialog.
- The encrypted-project dialog submits with `Enter` and closes with `Escape`.

## Scope Notes
- This feature refines the renderer workflow only. It does not change the encryption model or message persistence semantics.
- Encrypted project creation remains available, but it is moved off the default single-click path.
