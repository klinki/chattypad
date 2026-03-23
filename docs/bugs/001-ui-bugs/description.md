# Bug Description

## Title
Windows frameless window behavior and text rendering remain unstable

## Status
- open

## Reported Symptoms
- In custom frameless Windows mode, resizing can leave the window in a broken interaction state.
- After some resize operations, clicks inside the app can stop working or become intermittent.
- Hover and pointer behavior in the custom caption area has been inconsistent across attempts.
- Text rendering on Windows has at times looked blurry or washed out, especially around DPI-scaling behavior.

## Expected Behavior
- The app should support a custom ChattyPad-style frameless window on Windows without breaking resize, snap, focus, hover, or pointer input behavior.
- Text should render sharply on Windows displays without blurry scaling artifacts.

## Actual Behavior
- The stable shipped Windows path currently relies on native OS chrome rather than the intended custom frameless caption bar.
- The optional frameless experiment still shows resize flashing, hit-testing instability, and occasional lost input/focus behavior.
- Text rendering has improved, but end-to-end validation for the DPI-awareness changes is still incomplete.

## Reproduction Details
1. Run the app on Windows with the default native-chrome mode and confirm baseline behavior is stable.
2. Enable the frameless Windows experiment with `CHATTYPAD_WIN_FRAMELESS=1`.
3. Resize the window repeatedly using edges and corners.
4. Observe flashing during live resize and watch for pointer/focus instability after the resize completes.
5. Compare text sharpness across standard and high-DPI displays.

## Affected Area
- Main-process window configuration and renderer-mode wiring for Windows
- Renderer custom header, drag regions, and manual resize handles
- Windows DPI-awareness and renderer text presentation

## Constraints
- The shipped default on Windows must remain stable even if the experimental frameless path is still unresolved.
- Native resize, snap, focus, and caption-button behavior are more important than preserving custom chrome at all costs.
- Any future frameless fix must work without relying on broken `views://...?...` query-string behavior.

## Open Questions
- Whether Electrobun exposes enough lower-level Windows APIs to make frameless resize and hit-testing reliable without native chrome.
- Whether the remaining text quality concerns are now purely validation gaps or still indicate a platform integration issue.
