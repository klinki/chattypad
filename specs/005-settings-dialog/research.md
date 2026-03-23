# Research: Settings Dialog

## Platform-Specific Paths

### Windows
- Default: `%AppData%/chattypad`
- Resolution: `process.env.APPDATA` if available, falling back to `process.env.USERPROFILE/AppData/Roaming`.

### macOS/Linux
- Default: `~/.chattypad/` (as per spec)
- Alternatives: `~/.config/chattypad` (XDG standard)
- Resolution: `process.env.HOME` or `process.env.XDG_CONFIG_HOME`.

### Lookup Logic
The spec defines a prioritized lookup:
1. `CHATTYPAD_HOME` environment variable
2. `settings.json` in the application directory
3. `~/.chattypad/settings.json`
4. `~/.config/chattypad/settings.json`

## Settings Initialization

### Timing
Settings must be loaded before:
- Database initialization (since database path depends on settings).
- Main window creation (to provide settings to the renderer).

### Logic
A `SettingsManager` class in the main process will handle:
- Prioritized lookup.
- Loading/Parsing `settings.json`.
- Providing a default configuration if none is found.
- Saving changes back to the persistent file.

## IPC Bridge

### Contract
A shared contract in `src/shared/contracts/settings.ts` will define the IPC methods:
- `getSettings()`: Returns the current settings object.
- `updateSettings(partialSettings)`: Updates settings and persists them.

### Implementation
- Main process: Listen for `getSettings` and `updateSettings`.
- Renderer process: Invoke these methods via the Electrobun bridge.

## Open Questions / Clarifications
- **REVOLVED**: Should changes take effect immediately?
  - *Decision*: Database path changes will require a restart (standard for most apps). Other UI settings could be live-updated.
- **REVOLVED**: Format of `settings.json`.
  - *Decision*: Standard JSON.
