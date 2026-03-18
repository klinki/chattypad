# Quickstart: Initial User Experience Onboarding

## Feature Verification

To verify the onboarding flow, follow these steps:

### 1. Reset Database (Fresh Start)
Close ChattyPad and delete the `chattypad.db` file from the repository root:
```bash
rm chattypad.db
```

### 2. Launch Application
Start the application in development mode:
```bash
bun run start
```

### 3. Verify Blank State (Onboarding Message)
Confirm that the main content pane displays the following message centered in the view:
- **Icon**: 🗂️ (or similar folder/onboarding icon)
- **Title**: To start working, let's create a first project and thread
- **Description**: No projects found. Use the sidebar to add your first workspace project.

### 4. Transition to Data State
1. Use the sidebar to create a new project.
2. Confirm the onboarding message disappears immediately.
3. Observe the "No active thread" placeholder or the new project's first thread view.

### 5. Reversion to Blank State
1. Delete all projects you've created.
2. Confirm the onboarding message reappears after the last project is removed.
