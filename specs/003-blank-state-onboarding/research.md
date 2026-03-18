# Research: Initial User Experience Onboarding

## Technical Context

The ChattyPad desktop application uses a Bun-based main process and a React-based renderer process. Data is stored in a local SQLite database (`chattypad.db`) using the `bun:sqlite` driver.

### Seeding Logic Analysis
- **Location**: `src/main/database/seed.ts`
- **Trigger**: Called during application bootstrap in `src/main/app/main.ts`.
- **Behavior**: Idempotent; checks if the `projects` table is empty before inserting 3 projects, 7 threads, and multiple messages.
- **Decision**: The call to `seedDevelopmentData(db)` in `main.ts` must be removed to satisfy FR-005 and SC-003.

### UI Analysis (Main Content Pane)
- **Component**: `src/renderer/features/workspace/workspace-screen.tsx`
- **Empty State Logic**: Uses `WorkspaceEmptyState` from `src/renderer/components/workspace-shell.tsx` when `hasProjects` is false and no thread is active.
- **Decision**: Update `WorkspaceEmptyState` to show the required onboarding message.

### Data Management & Testing
- **Database Path**: `chattypad.db` in the repository root (resolved via `src/main/database/sqlite.ts`).
- **Reset Procedure**: Delete `chattypad.db` to simulate a fresh launch.
- **Decision**: Create a helper script or documentation for testers to easily reset the environment.

## Recommendations
- Remove the seeding call from `main.ts` entirely.
- Keep `seed.ts` for potential manual development use (e.g., via a CLI flag or hidden command) but disable it by default.
- Refactor `WorkspaceEmptyState` to be more user-friendly as per the specification.
