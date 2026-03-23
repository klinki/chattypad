# Bug Description

## Title
Locked project sidebar icon does not provide an unlock path

## Status
- open

## Reported Symptoms
- The lock icon shown in a locked encrypted project row cannot be used to unlock the project.
- There is no direct password prompt from the sidebar tree, so unlocking from the project row is impossible.

## Expected Behavior
- Clicking the lock icon in a locked encrypted project row should open an unlock prompt for that specific project.
- Entering the password in that prompt should unlock the project and refresh its visible contents.

## Actual Behavior
- The locked icon is rendered as a non-interactive visual indicator.
- Unlocking is only possible through indirect flows, and the sidebar row itself does not provide the required password prompt.

## Reproduction Details
1. Create or load an encrypted project that is currently locked.
2. Locate the locked project in the sidebar tree.
3. Click the lock icon in the project row.
4. Observe that no unlock prompt appears.

## Affected Area
- Renderer sidebar row actions: `src/renderer/components/sidebar.tsx`
- Renderer unlock flow: `src/renderer/features/workspace/workspace-screen.tsx`, `src/renderer/features/workspace/workspace-controller.ts`

## Constraints
- Unlock failures like `INVALID_PASSWORD` should not replace the entire workspace UI.
- The existing lock screen flow for the active project should continue to work.

## Open Questions
- Whether clicking the project title row should also open the unlock prompt or remain unchanged.
