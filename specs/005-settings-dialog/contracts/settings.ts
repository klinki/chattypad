# IPC Contract: Settings

The `Settings` contract defines the communication between the Main and Renderer processes for application-wide configuration.

## IPC Events (Main to Renderer)
None currently planned.

## IPC Methods (Renderer to Main)

### `getSettings()`
- **Parameters**: None
- **Returns**: `Settings` object
- **Description**: Retrieves the current application settings.

### `updateSettings(partialSettings: Partial<Settings>)`
- **Parameters**:
  - `partialSettings`: An object containing the settings to update.
- **Returns**: `Settings` object (the updated full settings)
- **Description**: Updates the settings with the provided values and persists them to the file system.

## TypeScript Interface
```typescript
export interface Settings {
  general: {
    databaseDir: string;
  };
}

export interface SettingsContract {
  getSettings: () => Promise<Settings>;
  updateSettings: (partialSettings: Partial<Settings>) => Promise<Settings>;
}
```
