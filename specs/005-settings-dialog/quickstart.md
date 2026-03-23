# Quickstart: Settings Dialog

## Setup
No special setup is required as settings are automatically initialized at startup.

## Testing the Settings Dialog
1. Open the settings dialog (e.g., from a gear icon or menu).
2. Go to the "General" section.
3. Observe the current database directory path (it should defaults to `%AppData%/chattypad` on Windows).
4. Update the path to a new location.
5. Save the settings.
6. Verify that `settings.json` is updated in the application's configuration directory.
7. Restart the application and verify that the database is now initialized in the new location.

## Environment Variable Test
1. Set `CHATTYPAD_HOME` environment variable to a specific directory.
2. Launch the application.
3. Verify that the settings dialog reflects the `CHATTYPAD_HOME` path for the database directory.
