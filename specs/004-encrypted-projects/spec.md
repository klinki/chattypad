# Feature Specification: Encrypted Projects

**Feature Branch**: `004-encrypted-projects`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: User description: "Let's create an encrypted project - special project which will hold all notes encrypted and will require user to enter a password before opening it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an Encrypted Project (Priority: P1)

As a security-conscious user, I want to create a new project that is explicitly marked as "Encrypted" and secured with a password so that my private notes are protected from unauthorized access.

**Why this priority**: This is the entry point for the entire feature. Users cannot benefit from encryption without being able to create these specialized projects.

**Independent Test**: Can be fully tested by selecting "New Encrypted Project" from the sidebar, providing a name and password, and verifying the project is created with an "Encrypted" indicator.

**Acceptance Scenarios**:

1. **Given** I am on the project creation screen, **When** I toggle the "Encrypted" option and provide a password, **Then** a new project is created that is visually distinct from normal projects.
2. **Given** I am creating an encrypted project, **When** I provide a password that does not meet minimum strength requirements (if applicable), **Then** I am prompted to improve the password before creation.

---

### User Story 2 - Unlock and Access Encrypted Project (Priority: P1)

As a user with an encrypted project, I want to be prompted for a password when I attempt to open it so that my data remains unreadable until I provide the correct credentials.

**Why this priority**: This is the core security mechanism. Without the lock, the feature provides no actual protection.

**Independent Test**: Can be fully tested by clicking an encrypted project in the sidebar and verifying that a password prompt appears and content is hidden until the correct password is entered.

**Acceptance Scenarios**:

1. **Given** an encrypted project exists and is currently locked, **When** I click on it in the sidebar, **Then** I am presented with a password entry field.
2. **Given** a password prompt for an encrypted project, **When** I enter the correct password, **Then** the project content (threads and messages) becomes visible and accessible.
3. **Given** a password prompt for an encrypted project, **When** I enter an incorrect password, **Then** I am shown an error message and the content remains hidden.
4. **Given** an encrypted project is locked, **When** it is shown in the sidebar tree, **Then** its thread list is forced collapsed and cannot be expanded until the project is unlocked.

---

### User Story 3 - Automatic Locking (Priority: P2)

As a user, I want my encrypted projects to automatically lock when I close the application or after a period of inactivity so that I don't accidentally leave sensitive data exposed.

**Why this priority**: Essential for maintaining security in real-world usage scenarios where a user might step away from their computer.

**Independent Test**: Can be tested by unlocking a project, restarting the application, and verifying that the project is locked again upon launch.

**Acceptance Scenarios**:

1. **Given** I have unlocked an encrypted project, **When** I close and reopen the application, **Then** the project must be unlocked again with a password.

---

### Edge Cases

- **Wrong Password Attempts**: How many times can a user enter the wrong password? (Assumption: Unlimited attempts for now, but with increasing delays to prevent brute-forcing: 0s for first 3, then 2s, 5s, 10s, and 30s for subsequent attempts).
- **Password Recovery**: What if the user forgets their password? (Assumption: Data is irrecoverable; a clear warning must be shown during project creation).
- **Mixed Content**: Can a normal project be converted to encrypted? (Assumption: No, for simplicity, encryption must be chosen at creation).
- **Inactivity Timeout**: The system will automatically re-lock an open encrypted project after 5 minutes of inactivity (no user interaction with the application).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support a specialized "Encrypted" project type.
- **FR-002**: System MUST encrypt all thread titles and message contents associated with an encrypted project before storing them. Project names will remain visible in the sidebar to allow for easy identification.
- **FR-003**: System MUST prompt for a password before allowing any access to the content of an encrypted project.
- **FR-004**: System MUST store the password hash (using a secure algorithm) to verify future access attempts without storing the plain-text password. No minimum password strength requirements will be enforced during project creation.
- **FR-005**: System MUST provide a visual indicator (e.g., a lock icon) in the sidebar for encrypted projects.
- **FR-006**: System MUST ensure that encrypted content is unreadable in the database file without the decryption key derived from the user's password.
- **FR-007**: System MUST provide a "Lock All" action to immediately re-secure all opened encrypted projects.
- **FR-008**: System MUST render locked encrypted projects as collapsed in the sidebar tree and MUST prevent expansion until the project is unlocked.

### Key Entities *(include if feature involves data)*

- **Encrypted Project**: A project with an additional encryption metadata flag and a password verification hash.
- **Encrypted Content**: Threads and messages whose payload is stored in an encrypted format.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of data associated with an encrypted project is stored in an unreadable (encrypted) format in the SQLite database.
- **SC-002**: Content is decrypted and displayed within 500ms of entering the correct password.
- **SC-003**: Access is blocked 100% of the time when an incorrect password is provided.
- **SC-004**: Users receive a clear, prominent warning about the lack of password recovery during project creation.
