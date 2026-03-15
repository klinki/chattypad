# Gemini CLI Agent Context: ChattyPad

## Project Context
- **Name**: ChattyPad
- **Type**: Desktop application
- **Technology Stack**:
  - **Language**: TypeScript / Bun 1.x
  - **Main Process**: Electrobun (Bun)
  - **Renderer Process**: React (Bun build)
  - **Database**: SQLite (via `bun:sqlite`)
- **Coding Standards**:
  - Strictly typed TypeScript.
  - Functional React components.
  - IPC via shared contract-based RPC.

## Active Feature: 002-ui-ux-refinement
- **Current Task**: Planning and implementing UI/UX enhancements.
- **Key Files**:
  - `src/main/app/main.ts`: Main process entry.
  - `src/renderer/components/sidebar.tsx`: Sidebar implementation.
  - `src/main/database/schema.ts`: Database schema.
  - `src/shared/contracts/workspace.ts`: Shared IPC types.

## Development Constraints
- Always use absolute paths for tool calls.
- Maintain separate `main`, `renderer`, and `shared` layers.
- Persist state in SQLite where applicable.
- Adhere to the ChattyPad Constitution.
