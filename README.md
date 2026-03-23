# ChattyPad

Desktop chat workspace application built with Bun, Electrobun, React, and SQLite.

## Development

- `npm run lint`
- `npm test`
- `npm start`

## Configuration

ChattyPad stores application settings in `settings.json` and looks for that file in this order:

1. `CHATTYPAD_HOME/settings.json`
2. `settings.json` in the application directory
3. `~/.chattypad/settings.json`
4. `~/.config/chattypad/settings.json`

To force a custom configuration home, set `CHATTYPAD_HOME` before launch:

```powershell
$env:CHATTYPAD_HOME = "C:\path\to\chattypad-config"
npm start
```

When `CHATTYPAD_HOME` is set and no explicit `general.databaseDir` has been saved yet, ChattyPad defaults the database directory to that same folder. Database-directory changes are persisted immediately and take effect after the next restart.
