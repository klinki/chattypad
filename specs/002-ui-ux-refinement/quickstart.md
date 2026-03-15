# Quickstart: UI and UX Refinements

This document provides a guide for using and testing the new UI/UX features.

## Testing Custom Window Header
1. Launch the application with `bun dev`.
2. Verify that the native title bar (minimize/maximize/close) is replaced by the custom UI.
3. Test window dragging by clicking and moving the custom header area.
4. Verify that minimize, maximize, and close buttons correctly control the window state.

## Testing Inline Creation
1. Click the "New Project" button in the sidebar.
2. A new project item should appear with the name "Project XX" (incremented).
3. The name should be fully selected, and the input should have focus.
4. Type a new name and press **Enter** to save, or **Esc** to cancel.
5. Repeat for adding threads within projects.

## Testing Sidebar Organization
1. **Collapsing**: Click the chevron icon (or similar toggle) on a project to hide its threads. Reload the app to verify the state persists.
2. **Reordering**: Click and hold a project or thread, then drag it to a new position. Verify the order is saved and persists after reload.
3. **Grouping**: Right-click a project and select "Move to Group". If no groups exist, use the sidebar context menu to "Create Group" first.

## Testing Context Menus
1. Right-click a project or thread in the sidebar.
2. Verify that the menu appears with "Rename" and "Delete" options.
3. For projects, verify the "Move to Group" submenu correctly lists available project groups.
