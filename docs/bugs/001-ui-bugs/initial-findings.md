# Initial Findings

## Confirmed Facts
- Native Windows chrome is the currently shipped default because it is the first configuration that restored reliable resize, snap, focus, and caption-button behavior.
- The optional frameless Windows mode remains experimental and is enabled with `CHATTYPAD_WIN_FRAMELESS=1`.
- The previous `views://renderer/index.html?windowMode=...` approach broke Windows loading on March 18, 2026; renderer mode is now injected after DOM ready instead.
- Manual resize handles were added for frameless Windows mode, but testing still showed severe flashing during live resize.
- CSS text-rendering overrides were relaxed and Windows DPI-awareness manifests were added to the build pipeline, but high-DPI validation is still incomplete.

## Likely Cause
- The remaining frameless-window issues appear to be deeper than React or CSS event wiring and are likely tied to how Electrobun maps Windows native window styles, hit-testing, compositing, and DWM behavior for custom chrome windows.
- The text-rendering issue may be partially addressed already, leaving validation and remaining platform integration details as the main unknowns.

## Unknowns
- Whether a reliable fully frameless Windows solution is achievable with the current Electrobun API surface.
- Whether the DPI manifest and native-renderer changes fully resolve blurry text on real high-DPI Windows hardware.

## Reproduction Status
- Historically reproduced through repeated Windows experiments and documented implementation attempts.
- Still considered open because the frameless custom-chrome path remains unstable even after multiple mitigations.

## Evidence Gathered
- `titleBarStyle: "hidden"` removed visual chrome but broke edge resizing and snap behavior.
- `hiddenInset` and related style-mask combinations restored some native behaviors but introduced an unwanted white top border from DWM.
- Transparent/layered-window attempts and drag-region restructuring did not produce a shippable custom-chrome result.
- Switching Windows back to the native renderer was a sound cleanup but did not fix the broader frameless instability by itself.
- Native chrome plus an in-app branded header is currently the best stable compromise.
- The query-string renderer-mode regression was fixed by switching to post-load JavaScript injection.
- Manual resize throttling reduced update frequency but did not eliminate resize flashing.

## Current Direction
- Keep native OS chrome as the shipped Windows default.
- Treat the frameless path as experimental only until resize, hit-testing, hover, focus, and input behavior are all reliable.
- Retain the DPI-awareness and text-rendering cleanups, but continue validating them on real Windows displays before declaring the text issue fully resolved.
