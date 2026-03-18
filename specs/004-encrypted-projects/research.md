# Research: Encrypted Projects

## Technical Analysis

### 1. Encryption Library (Bun Native)
- **Decision**: Use Bun's native `Web Crypto API` (`crypto.subtle`) for AES-GCM (Advanced Encryption Standard with Galois/Counter Mode).
- **Rationale**: AES-GCM provides both confidentiality and authenticity, ensuring that the encrypted notes haven't been tampered with. It's built into Bun, so no external dependencies are needed.
- **Alternatives**: `crypto-js` (JavaScript only, slower) or `libsodium-wrappers` (more complex to integrate).

### 2. Password Hashing & Key Derivation
- **Decision**: Use `Bun.password.hash` (Argon2 by default) for stored password verification and `PBKDF2` for deriving the actual encryption key.
- **Rationale**: Storing a hash for verification prevents storing the plain-text password. Deriving a separate key using PBKDF2 ensures that the key is unique to the user's password and the project's salt.
- **Salt Management**: A unique salt will be generated per project and stored in the database.

### 3. Inactivity Timeout implementation
- **Decision**: Global event listener in the React renderer (`mousemove`, `keydown`, `click`) that resets an inactivity timer.
- **Rationale**: This is the standard way to detect user activity in a web-based shell. When the timer reaches 5 minutes, it sends a `lock:all` IPC message to the main process.
- **Constraints**: We must ensure that the timer only runs for *unlocked* projects.

### 4. Database Schema Updates
- **Decision**: Add `is_encrypted` (INTEGER) and `password_hash` (TEXT) columns to the `projects` table.
- **Rationale**: This allows us to flag projects for encryption and store the verification hash. Encrypted titles and contents will be stored as Base64-encoded strings in the existing `TEXT` columns.

## Research Agents Tasks (Internal)
- Task: Research Bun's `crypto.subtle.deriveKey` with PBKDF2 for desktop environments.
- Task: Research Electrobun's `RPC` message handlers for synchronous password verification.
- Task: Research best practices for storing salts and IVs (Initialization Vectors) in SQLite.

## Consolidated Findings
The implementation will rely on Bun's native crypto primitives. No third-party crypto libraries are needed, keeping the dependency tree lean.
