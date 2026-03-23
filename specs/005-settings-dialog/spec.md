# Feature Spec: Settings Dialog

## Description
A simple settings dialog for ChattyPad to configure global application settings.

## Requirements
- Single section called "General".
- Database storage directory configuration:
  - Windows default: `%AppData%/chattypad`
  - Non-Windows default: `~/.chattypad/`
- Settings persistence: `settings.json`
- Configuration lookup order (highest priority first):
  1. `CHATTYPAD_HOME` environment variable
  2. `settings.json` in the application directory
  3. `~/.chattypad/settings.json`
  4. `~/.config/chattypad/settings.json`

## UI/UX
- Modal dialog or dedicated settings view.
- "General" tab/section.
- Path input for database directory with validation and potentially a directory picker.

## Technical Details
- Settings should be loaded at startup.
- The database directory should be resolved using the prioritized list.
- Changes in settings should take effect immediately or after restart (to be decided).
