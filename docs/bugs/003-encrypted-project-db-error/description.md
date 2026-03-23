# Bug: Database error after creating encrypted project

**Status**: Open
**Priority**: Critical

## Symptoms
User reports a "database error" displayed in the UI immediately after attempting to create a new encrypted project.

## Expected Behavior
The encrypted project should be created and persisted in the database without errors.

## Actual Behavior
The system reports a database error, likely during the insertion or retrieval of the new project.

## Reproduction Details
1. Launch ChattyPad.
2. Click "+" to create a new project.
3. Toggle "Encrypted Project".
4. Enter a name and password.
5. Click "Create Project".

## Affected Area
- Backend: `workspace-service.ts`, `workspace-repository.ts`
- Database: SQLite schema/migration

## Open Questions
- Is the error "no such column"?
- Is it a constraint violation?
- Is there a mismatch between the `Project` model and the `projects` table row?
