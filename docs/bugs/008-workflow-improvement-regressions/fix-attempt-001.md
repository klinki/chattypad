# Fix Attempt 001

## Goal
- Keep the fast project/thread creation workflow in inline naming mode until the user explicitly confirms each step, and make encrypted-project dialog opening reliable.

## Proposed Change
- Add controller-level snapshot application options so workflow actions can update the sidebar snapshot without reopening the main thread view.
- Use those options in the fast plain-project flow until the thread title is confirmed with `Enter`.
- Ensure the encrypted-project dialog renders above the create menu after long-press selection.

## Risks
- Suppressing active-thread reopening too broadly could break normal project/thread selection behavior.
- The workflow must still recover cleanly if the user cancels or blurs the inline editors.

## Files And Components
- `src/renderer/features/workspace/workspace-controller.ts`
- `src/renderer/features/workspace/workspace-screen.tsx`
- `src/renderer/components/sidebar.tsx`
- `tests/unit/workspace-controller.test.ts`

## Verification Plan
- Add focused controller tests for snapshot application without thread activation.
- Run `bun test tests/unit/workspace-controller.test.ts`.
- Run `npm run lint`.

## Implementation Summary
- Added controller-level snapshot application options so workflow actions can suppress automatic thread reopening while still updating the sidebar snapshot.
- Updated the fast plain-project flow to create and rename the project with `openActiveThread: false`, then create the initial thread in the same non-activating mode.
- Updated workflow thread title confirmation to open the thread only after `Enter`, then explicitly request composer focus.
- Updated manual thread creation from the project row `+` button to use the same inline-title-first workflow.
- Raised the project dialog overlay stacking order so the encrypted-project dialog can render above the create context menu reliably.

## Test Results
- `bun test tests/unit/workspace-controller.test.ts` ✅
- `npm run lint` ✅

## Outcome
- Pending user verification.

## Remaining Gaps
- Pending implementation.
