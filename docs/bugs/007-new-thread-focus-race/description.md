# Bug Description

## Title
New thread creation can focus the wrong thread

## Status
- open

## Reported Symptoms
- After creating a new thread, the new thread is not reliably focused.
- Under repeated clicking across projects and threads, a completely different thread, sometimes in another project, can become the focused thread instead.

## Expected Behavior
- Creating a new thread should make that newly created thread the active thread immediately and consistently.
- Other in-flight sidebar actions should not steal focus away from the new thread unless the user explicitly selects another thread afterward.

## Actual Behavior
- Snapshot responses from unrelated actions can overwrite the user’s latest thread intent because the renderer controller always trusts `snapshot.activeThreadId` from the response.
- This can redirect focus to another thread when multiple sidebar actions overlap.

## Reproduction Details
1. Use a workspace with multiple projects and threads.
2. Rapidly click around projects/threads and create a new thread.
3. Observe that the created thread is not always selected and another thread may become active instead.

## Affected Area
- Renderer controller snapshot orchestration: `src/renderer/features/workspace/workspace-controller.ts`
- Renderer active-thread highlighting: `src/renderer/features/workspace/workspace-screen.tsx`

## Constraints
- Explicit user thread selections should still win when they happen after thread creation.
- Snapshot-only operations like reorder or collapse should not reset thread focus if the intended thread still exists.

## Open Questions
- Whether any main-process snapshot responses should eventually carry the current active thread id explicitly for all operations.
