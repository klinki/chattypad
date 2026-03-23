# Fix Attempt 003

## Goal
- Make the create menu reliably open the encrypted-project dialog and keep encrypted project creation inside the fast thread-rename workflow.

## Proposed Change
- Remove long-press handling from the sidebar `+` button and keep the project-type menu on right click only.
- Update encrypted project creation to suppress main-thread activation, close the dialog, create the initial thread automatically, and focus inline thread naming.

## Risks
- Pointer-only handling must not break keyboard activation of the `+` button.
- Encrypted project creation still needs to unlock the new project for the current session before auto-creating the initial thread.

## Files And Components
- `src/renderer/components/sidebar.tsx`
- `src/renderer/features/workspace/workspace-screen.tsx`
- `docs/features/workflow-improvement/feature-spec.md`

## Verification Plan
- Run `npm run lint`.
- Manually verify right click `+` -> `Create new encrypted project` opens the dialog.
- Manually verify confirming encrypted project creation opens inline thread naming instead of stopping at the project.

## Implementation Summary
- Removed long-press handling from the sidebar `+` button so left click is always the fast plain-project path and right click is the only way to open the project-type menu.
- Updated encrypted project confirmation to create the project without activating the main thread view, close the dialog, create the first thread automatically, and focus inline thread-name editing.
- Updated the workflow feature spec to reflect that encrypted project creation now continues directly into the first-thread naming step via the right-click menu.

## Test Results
- `npm run lint` ✅

## Outcome
- Fixed. User confirmed on 2026-03-23 that the focus regressions are resolved and accepted the final interaction change to use right click, not long press, for encrypted project creation.

## Remaining Gaps
- None recorded for this bug. The long-press interaction was intentionally removed from scope in favor of a more reliable right-click menu.
