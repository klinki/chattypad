# UI and UX Bugs

## 1. Frameless Window Resizing and Native OS Chrome Glitches (Windows)
**Description:** 
When using a custom React header to replace the default OS window chrome, the window loses native interactions such as edge-resizing and Aero Snapping. However, attempting to restore these native interactions introduces visual glitches (like a 1-2px solid white top border drawn by the Windows Desktop Window Manager).

**Approaches Taken to Fix:**
1. **`titleBarStyle: "hidden"`**: Successfully removed all ugly native OS chrome, but completely stripped `WS_THICKFRAME`, breaking all edge resizing and window snapping.
2. **`titleBarStyle: "hiddenInset"` + `styleMask: { Resizable: true }`**: Restored resizing and snapping hit-boxes, but DWM forced a white border to render at the top of the window.
3. **`transparent: true`**: We attempted to enable transparency to force Windows into a layered window compositing mode. This was intended to drop the solid borders while retaining the invisible resize handles. 
4. **Altering `Titled: false/true`**: Toggling specific `styleMask` flags in conjunction with the above settings resulted in inconsistent behavior (either the border returned, or resizing broke again).
5. **Separating drag region from window controls in the React header**: We restructured the custom header so the title area was the only draggable region and the minimize / maximize / close button cluster lived in a dedicated `no-drag` container. We also added explicit pointer hover handlers and `no-drag` styles directly on each button.
   * *Reasoning*: The hover state for the custom window buttons was not firing reliably, suggesting the control region was still being treated as part of the draggable title bar on Windows.
   * *Outcome*: This made the overall window interaction less stable. After resizing, the window could become difficult or impossible to click into, and the client sometimes appeared to stop accepting pointer input until focus was regained externally.
6. **Switching Windows from forced CEF to Electrobun's native renderer**: We changed the main window config so Windows resolves to the native renderer instead of forcing `renderer: "cef"`.
   * *Reasoning*: Electrobun's Windows default is the native renderer, and forcing CEF looked like a likely contributor to blurry text and mismatched platform behavior.
   * *Outcome*: This was a reasonable technical cleanup and should remain documented, but it did not resolve the broader frameless interaction instability by itself.
7. **Platform fallback to native Windows chrome**: We changed the Windows window configuration to use `titleBarStyle: "default"` with `transparent: false`, and we stopped rendering the custom React header on Windows entirely.
   * *Reasoning*: The resize/focus/input failures appear tied to the frameless transparent custom-chrome path, not just to hover styling. A stable native title bar is a safer fallback than continuing to fight broken hit-testing and input capture.
   * *Outcome*: This works reliably and is the first stable Windows behavior we have found. It restores native resize, snap, focus, and caption-button behavior. However, it is explicitly a fallback and not the desired final UX because it abandons the custom ChattyPad header on Windows.
8. **Native chrome plus in-app faux header**: We kept native Windows chrome for stability but reintroduced a ChattyPad-branded header strip inside the app content so the UI still has a deliberate top bar below the system caption area.
   * *Reasoning*: This preserves the stable OS-managed window behavior while recovering some of the intended product identity and layout structure.
   * *Outcome*: This is now the default Windows presentation. It is visually closer to the intended design than pure native chrome, but it still does not achieve a truly custom caption bar.
9. **Windows-only frameless experiment without transparency**: We added an opt-in Windows mode that uses the native renderer with `titleBarStyle: "hidden"` and `transparent: false`, while keeping the custom React header and draggable regions.
   * *Reasoning*: The combination of frameless chrome and transparency looked like the highest-risk configuration. This experiment isolates whether transparent compositing is the real trigger by keeping custom chrome but removing the layered transparent window path.
   * *How to enable*: Launch with `CHATTYPAD_WIN_FRAMELESS=1`.
   * *Outcome*: This remains an experiment only. Buttons and dragging improved, but resize behavior stayed poor enough that we reverted Windows back to native chrome by default.
10. **Renderer mode passed via `views://.../index.html?windowMode=...` query string**: We tried encoding the selected window mode directly into the view URL so the renderer could switch between the inline faux header and the frameless custom header.
   * *Reasoning*: This was intended to keep the renderer and main-process window mode in sync without adding extra IPC or preload plumbing.
   * *Outcome*: This broke the app on Windows on **March 18, 2026**. Electrobun attempted to load a literal file path ending in `index.html?windowMode=native`, which does not exist, so the renderer content failed to load and the app displayed a blank dark window.
   * *Observed log output*:
     * `ERROR: Could not open views file: C:\ai-workspace\chattypad\build\dev-win-x64\chattypad-dev\bin\..\Resources\app\views\renderer/index.html?windowMode=native`
     * `[WebView2] NavigationCompleted fired for webview 1`
     * `[WebView2] NavigationStarting fired for webview 1`
     * `[WebView2 NavigationStarting] Ctrl+click detected, url=about:blank`
   * `[WebView2 NavigationStarting] Firing new-window-open: {"url":"about:blank","isCmdClick":true,"modifierFlags":0}`
   * `[WebView2] NavigationCompleted fired for webview 1`
   * *Conclusion*: Electrobun's local `views://` loader does not safely support query strings in the HTML asset path, at least in this Windows setup. Any renderer mode selection needs to be passed some other way.
11. **Renderer mode injected after `dom-ready` instead of using the `views://` URL**: We removed the query string from the HTML asset path and now keep the window URL fixed at `views://renderer/index.html`. The main process injects the selected window mode into the webview via JavaScript after the renderer DOM is ready.
   * *Reasoning*: This preserves a valid `views://` asset path while still allowing Windows to switch between the stable native-chrome presentation and the opt-in frameless experiment.
   * *Outcome*: This fixes the blank-window regression caused by the broken `index.html?windowMode=...` path. The app should load normally again.
12. **Manual resize handles for frameless Windows mode**: Because Electrobun exposes window frame setters but not a native `startWindowResize` API, we added explicit edge and corner resize handles inside the renderer for frameless Windows mode. These handles query the current window frame and then update it during pointer drag.
   * *Reasoning*: In the frameless non-transparent setup, custom buttons and drag interactions can work while native edge resizing does not. Manual handles replace the missing native resize hit-testing with deterministic app-controlled resizing.
   * *Outcome*: This restores resizing, but Windows testing showed visible flashing during live resize.
13. **Throttle manual resize updates to reduce flashing**: We reduced the resize loop to a capped cadence and removed an extra native frame readback after each resize step.
   * *Reasoning*: The first manual-resize loop pushed `setFrame` updates too aggressively, which likely forced repeated native redraws and made the window flash while dragging.
   * *Outcome*: Implemented, but manual Windows testing still showed very bad flashing during resize. This was not good enough to ship.

**Current Status:**
The frameless Windows path remains unstable. As of **March 18, 2026**, the following problems are still reproducible in custom-chrome mode:

- Resizing can leave the window in a broken interaction state.
- After certain resize operations, clicks inside the app may stop working or only work intermittently.
- The window can appear to lose focus or stop accepting pointer input even while still visible.
- Hover feedback on the custom caption buttons has been inconsistent across attempts.

The ideal "fully resizable + perfectly frameless without artifacts" state remains unresolved. At this point the issue appears broader than CSS or React event wiring and is more likely tied to how Electrobun maps Windows native `HWND` styles, hit-testing, transparent compositing, and DWM behavior for custom chrome windows.

The current working direction is:

- **Shipped default**: use native OS chrome on Windows. This is confirmed working and is now the active fallback again.
- **Optional styling layer**: keep the in-app faux ChattyPad header when useful, but do not rely on it for native window behavior.
- **Experimental path**: only enable frameless Windows mode with `CHATTYPAD_WIN_FRAMELESS=1`.
- **Desired end state**: keep the custom frameless Windows header only if resize, hit-testing, hover, focus, and input behavior prove reliable under a future lower-level fix.

Current blocker as of **March 18, 2026**:

- The `views://` query-string regression was fixed by switching to post-load JS injection for renderer mode selection.

---

## 2. Blurry Text / DPI Scaling Issues (Windows)
**Description:**
The text in the UI does not look crystal clear and appears slightly washed out or blurry. This is commonly associated with CSS antialiasing overrides or the underlying webview failing to properly respect the monitor's high-DPI scaling factor.

**Approaches Taken to Fix:**
1. **CSS Text Rendering Overrides**: We removed `-webkit-font-smoothing: antialiased;` and `-moz-osx-font-smoothing: grayscale;` from `src/renderer/index.html` and set them to `auto`. 
   * *Reasoning*: On Windows Chromium environments, forcing `antialiased` disables the native ClearType (subpixel) rendering pipeline, causing fonts to look thin and out of focus on standard DPI displays.
2. **Removing `text-rendering: optimizeLegibility`**: We changed the global renderer CSS back to `text-rendering: auto`.
   * *Reasoning*: `optimizeLegibility` is not helpful for this desktop UI and can interfere with the platform's normal text rasterization choices.
3. **Using the native Windows renderer instead of forced CEF**: We updated the main window config so Windows uses Electrobun's native renderer.
   * *Reasoning*: This matches the framework's intended default on Windows and is the most likely path to correct DPI awareness and sharper text rendering.

**Current Status:**
Text rendering was cleaned up at the CSS and renderer-selection level, but the more serious blocker is now the unstable frameless window behavior described above. Further investigation is still needed into Electrobun's Windows backend, especially DPI awareness, transparent/layered window behavior, resize hit-testing, and focus/input handling after native resize operations.
