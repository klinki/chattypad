# ChattyPad Design System

Welcome to the **ChattyPad Design System**. This document outlines the visual language, design tokens, and component patterns that define the project's minimalist, high-density aesthetic.

Inspired by professional code editors and minimalist note-taking applications like Codex, ChattyPad prioritizes **content over chrome**, using spacing and subtle translucent overlays instead of heavy borders and vibrant colors.

---

## 🎨 Core Color Palette (CSS Tokens)

ChattyPad uses a monochromatic dark theme with a single accent color for primary actions. These are defined as CSS variables in `src/renderer/index.html`.

| Variable | Value | Usage |
| :--- | :--- | :--- |
| `--bg-darker` | `#0c0c0e` | Main application workspace background. |
| `--bg-sidebar` | `#111113` | Sidebar background and primary containers. |
| `--bg-header` | `#111113` | Top navigation and window control backgrounds. |
| `--bg-hover` | `rgba(255, 255, 255, 0.05)` | Hover states for buttons and menu items. |
| `--bg-active` | `rgba(255, 255, 255, 0.08)` | Selected/Active states for threads/projects. |
| `--accent` | `#7c7cfc` | Secondary highlight purple. |
| `--text-main` | `#e1e1e1` | Primary readable text (90% white). |
| `--text-muted` | `#8e9099` | Secondary text, labels, and icons. |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | Unified border color for separators and pods. |

---

## 🔡 Typography

We use a high-precision, clean sans-serif stack led by **Inter**.

*   **Primary Font Family**: `'Inter', -apple-system, system-ui, sans-serif`
*   **Body Text (Chat Logs)**: `14px` size, `1.6` line-height.
*   **Labels (Timestamps/Metadata)**: `10px` size, `500` weight, `uppercase` with `0.05em` letter-spacing.
*   **Navigation (Sidebar)**: `13px` size, `400` weight (Regular) for threads, `500` weight (Medium) for active items.
*   **Anti-Aliasing**: High-performance font smoothing (`-webkit-font-smoothing: antialiased`) is enforced globally.

---

## 📐 Layout & Spacing

Layout in ChattyPad is defined by **Breathing Room** and **Logical Alignment**.

*   **The 200px Gutter**: All chat messages are left-aligned with a strict `200px` left margin. This creates a focused reading column and room for metadata like dates.
*   **Base Spacing Unit**: 4px / 8px / 16px multiples are used for all paddings and gaps.
*   **Message Gap**: `32px` vertical gap between messages to prevent visual crowding.
*   **Composer Dimensions**: The input area auto-scales up to `30vh` (30% of viewport height) or can be manually expanded up to `50vh`.

---

## 🧊 Shapes & Borders

ChattyPad uses a hierarchy of rounded corners to differentiate between static UI and interactive "Pods."

| Element | Radius | Rationale |
| :--- | :--- | :--- |
| **Sidebar Items** | `6px` | Tight rounding for list-heavy interfaces. |
| **Input Pod** | `12px` | Soft rounding for the primary interactive area. |
| **Message Pods** | `12px` | Matches the input pod for visual continuity. |
| **Buttons** | `10px` (Send) / `6px` (Actions) | Differentiates large vs small actions. |

---

## 🧩 Component Patterns

### 1. The "Translucent Pod"
Used for both the **Message Composer** and **Message Bubbles**. 
- **Style**: `background: rgba(255, 255, 255, 0.04)`, `border: 1px solid var(--border-subtle)`.
- **Goal**: To make interactive content feel "inset" into the application surface without using heavy shadows or solid colors.

### 2. The Integrated Action
Send buttons and secondary actions are nested *inside* the containers they support.
- **Example**: The Send icon is absolutely positioned at the bottom-right of the textarea pod.

### 3. Accordion Navigation
Sidebar projects use a smooth `max-height` transition for collapse states, avoiding the "jumping" effect of instant toggles.

### 4. Custom Scrollers
Browser scrollbars are replaced with a minimal `5px` wide track using `#ffffff1a` thumb color to ensure they never break the minimalist dark theme.
