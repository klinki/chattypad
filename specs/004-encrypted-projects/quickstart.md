# Quickstart: Encrypted Projects

## Prerequisites
-   ChattyPad installed and running in a dev environment (`npm run dev`).

## Step 1: Create an Encrypted Project
1.  Open the ChattyPad main screen.
2.  Click the `+` icon in the sidebar to create a new project.
3.  In the project creation dialog, enter a name for the project (e.g., "Private Diary").
4.  Toggle the **Encrypted** switch.
5.  Provide a password for the project and click **Create Project**.
6.  Observe that the new project has a lock icon in the sidebar.

## Step 2: Unlock and View Content
1.  Click the newly created encrypted project in the sidebar.
2.  Observe that the project remains collapsed in the sidebar tree while locked and that its expand toggle cannot be used.
3.  Observe that the main content area shows a **Project is Locked** message with a password field.
4.  Enter an incorrect password and click **Unlock**. Observe the error message.
5.  Enter the correct password and click **Unlock**.
6.  Observe that the project content (empty for now) becomes accessible and the project can be expanded again in the sidebar.

## Step 3: Verify Security
1.  Add a new thread and some messages to the encrypted project.
2.  Lock the project manually (if a lock button is available) or restart the app.
3.  Reopen the app and observe that the project is locked again.
4.  Optional: Use a database viewer (e.g., SQLite DB Browser) to open `chattypad.db`.
5.  Locate the `chat_threads` and `messages` associated with the project's ID.
6.  Verify that the titles and contents are stored as encrypted blobs, not plain text.

## Step 4: Automatic Locking
1.  Unlock the project and leave it open.
2.  Wait for 5 minutes without interacting with the app.
3.  Verify that the project automatically locks and prompts for the password again.
