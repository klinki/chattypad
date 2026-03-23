# Implementation Plan: Settings Dialog

**Branch**: `005-settings-dialog` | **Date**: 2026-03-23 | **Spec**: [/specs/005-settings-dialog/spec.md]
**Input**: Feature specification from `/specs/005-settings-dialog/spec.md`

## Summary
Implement a settings dialog to manage application-wide configuration, specifically the database storage directory. Settings will be persisted in `settings.json` with a prioritized lookup strategy (ENV > app dir > user home > user config).

## Technical Context

**Language/Version**: TypeScript / Bun 1.x  
**Primary Dependencies**: Electrobun, React  
**Storage**: JSON (`settings.json`)  
**Testing**: Bun test  
**Target Platform**: Windows (primary), macOS/Linux (fallback)
**Project Type**: Desktop app (Electrobun)  
**Performance Goals**: Instant loading of settings at startup.  
**Constraints**: Settings must be available before the main window or database initialization.  
**Scale/Scope**: Small - single dialog, single section, handful of settings.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Specification-First | ✅ | `spec.md` exists and defines scope. |
| II. Independent Value | ✅ | Settings can be verified independently via UI and file system. |
| III. Explicit Assumptions | ✅ | Priority lookup order and default paths are defined. |
| IV. Simplicity | ✅ | Using standard JSON and platform-native paths. |
| V. Documentation | ✅ | Plan includes all required Phase 0/1 artifacts. |

## Project Structure

### Documentation (this feature)

```text
specs/005-settings-dialog/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (to be created)
```

### Source Code (repository root)

```text
src/
├── main/
│   ├── app/
│   │   └── settings.ts       # Settings management logic (Main process)
│   └── ipc/
│       └── settings.ts       # IPC handlers for settings
├── renderer/
│   ├── components/
│   │   └── SettingsDialog.tsx # React UI for settings
│   └── ipc/
│       └── settings.ts       # IPC bridge for settings
└── shared/
    └── contracts/
        └── settings.ts       # Type definitions and IPC contracts
```

**Structure Decision**: Adhering to the existing `main`, `renderer`, `shared` structure. IPC will be used to communicate settings between processes.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
