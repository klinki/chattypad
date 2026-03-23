# Data Model: Settings

## Settings Object

The settings will be stored as a JSON object in `settings.json`.

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `general` | `object` | General application settings. | `{}` |
| `general.databaseDir` | `string` | Absolute path to the database directory. | Platform-specific (see below) |

## Platform-Specific Defaults

### Windows
`%AppData%/chattypad`

### macOS/Linux
`~/.chattypad`

## JSON Schema Example
```json
{
  "general": {
    "databaseDir": "C:/Users/AgentRunner/AppData/Roaming/chattypad"
  }
}
```

## Validation Rules
- `databaseDir` must be an absolute path.
- The path must be writable by the application.
- If the path doesn't exist, the application should attempt to create it (or warn the user).
