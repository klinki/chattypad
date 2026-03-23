# Status: Database error after creating encrypted project

**Status**: Fixed
**Date**: 2026-03-19

## Summary
The "database error" was caused by a `ReferenceError` where `crypto.randomUUID()` was used without being imported in `src/main/app/workspace-service.ts`. This was compounded by synchronous handlers returning `Promise` objects to the renderer.

## Resolution
- Imported `randomUUID` from `crypto` in `workspace-service.ts`.
- Refactored all project and thread management handlers to be correctly asynchronous.
- Added auto-unlock logic so that newly created projects are immediately accessible.
- Enhanced error mapping to correctly identify "Project is locked" states.

## Verification
- [x] Verified project creation with encryption.
- [x] Verified no `ReferenceError` occurs during UUID generation.
- [x] Verified the database columns are correctly added via migrations.
