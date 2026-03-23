# Bug Status

## Current State
- fixed

## Confirmation Date
- 2026-03-23

## Resolution Summary
- Investigation started on 2026-03-23 after the new workflow feature regressed thread focus and encrypted-project creation.
- The fast plain-project flow was updated so project and thread naming complete before the composer activates.
- Encrypted project creation now continues directly into first-thread naming.
- The original long-press menu design was removed in favor of a more reliable right-click project-type menu, which the user accepted on 2026-03-23.

## Notes
- `WorkspaceScreen` and `workspace-controller` now support workflow-only snapshot updates without reopening the main thread view too early.
- The sidebar `+` button now uses left click for fast plain-project creation and right click for the project-type menu.
