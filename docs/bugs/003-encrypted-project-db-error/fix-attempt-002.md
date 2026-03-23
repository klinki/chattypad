# Fix Attempt 002: Automatic Project Unlock and Improved Error Reporting

## Goal
Resolve the "DB_OPEN_FAILED" error by ensuring projects are automatically unlocked in the main process session after creation and improve error reporting to reveal the true cause of failures.

## Proposed Change
- **Auto-Unlock**: Update `createProject` in `src/main/app/workspace-service.ts` to derive the encryption key and add it to the `sessionKeys` map immediately after creation.
- **Renderer Key Sync**: Update `createProject` in `src/renderer/features/workspace/workspace-controller.ts` to derive and store the encryption key in the renderer's `workspaceStore` after creation.
- **IPC Error Mapping**: Update `toIpcError` in `src/main/app/ipc-error.ts` to explicitly handle "Project is locked." errors and return a `PROJECT_LOCKED` code instead of letting it fall back to a generic `DB_OPEN_FAILED`.
- **Contract Update**: Add `encryptionSalt` to `ProjectSummary` in `src/shared/contracts/workspace.ts` to allow the renderer to derive keys without knowing the plain-text password again (after the initial creation/unlock).
- **Repository Update**: Update `projectToSummary` in `src/main/database/workspace-repository.ts` to include the `encryptionSalt` field.

## Risks
- Minor change to IPC contracts (backwards compatible).
- Increased main process memory usage (storing session keys).

## Files Involved
- `src/main/app/workspace-service.ts`
- `src/renderer/features/workspace/workspace-controller.ts`
- `src/main/app/ipc-error.ts`
- `src/shared/contracts/workspace.ts`
- `src/main/database/workspace-repository.ts`

## Actual Implementation Summary
- Implemented auto-unlock logic in both processes.
- Enhanced error mapping for lock states.
- Synchronized encryption salt via IPC.

## Outcome
Waiting for user verification.
