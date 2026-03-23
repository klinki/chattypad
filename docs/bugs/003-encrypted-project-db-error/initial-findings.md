# Investigation: Database error after creating encrypted project

## Confirmed Facts
- A "database error" appears in the UI after clicking "Create Project" for an encrypted project.
- The bundling issue (Bug 002) was fixed, allowing the app to start.
- `src/main/app/workspace-service.ts` was using `crypto.randomUUID()` without an explicit import, while `src/main/app/message-service.ts` used `import { randomUUID } from "crypto"`.

## Likely Cause
1. **ReferenceError**: `crypto.randomUUID()` is likely not globally available in the Bun main process environment, causing a `ReferenceError` that is caught by `withIpcErrorAsync` and reported as a generic database error.
2. **Schema Migration**: Although `ALTER TABLE` statements were added, they might have failed or not been triggered correctly if the database was already in a state that didn't match the expected schema.

## Evidence Gathered
- Code review showed `workspace-service.ts` lacked the `crypto` import but called `crypto.randomUUID()`.
- Added logging to `withIpcErrorAsync` to capture the actual error object in the console.
