# Bug Description

## Title
Windows taskbar icon falls back to the Bun icon

## Status
- open

## Reported Symptoms

- The Windows taskbar shows the Bun onion icon instead of the ChattyPad app icon.
- The app appears to launch normally, but the Windows shell is not using the intended product icon.
- When launched with `npm run start`, the window title bar still shows the generic Windows app icon.

## Expected Behavior

- ChattyPad should display its own branded icon in the Windows taskbar and window chrome where applicable.

## Actual Behavior

- Windows appears to fall back to the Bun runtime icon.
- The taskbar icon can be branded while the live window chrome still shows the generic Windows glyph.

## Reproduction Details

1. Build and launch the Windows desktop app.
2. Observe the taskbar icon while the app is running.
3. Compare it to the intended ChattyPad icon.
4. Run `npm run start` and inspect the title-bar icon.

## Affected Area

- Electrobun Windows build configuration
- Windows executable/resource icon embedding

## Constraints

- The fix should preserve Linux icon handling.
- The Windows icon should remain consistent across the installer, launcher, and taskbar.

## Open Questions

- Is Windows falling back because the app is configured with a PNG instead of a Windows ICO?
- Does the taskbar icon come from the launcher, the installer wrapper, or the bundled app executable?
- Does the live title-bar icon require a separate runtime call during `electrobun dev`?
