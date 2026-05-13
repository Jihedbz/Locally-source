# Architecture Documentation

Locally is a cross-platform desktop application built using the [Tauri](https://tauri.app/) framework. It brings together a high-performance Rust backend with a modern, reactive React frontend. This document outlines the system architecture, design patterns, and directory structure used in the project.

---

## 1. High-Level Architecture

Locally follows a client-server-like model but entirely localized on the desktop:
- **Frontend (WebView)**: A React application providing the user interface. It runs in the system's native webview (e.g., WebView2 on Windows, WebKit on macOS/Linux).
- **Backend (Core)**: A Rust application managing system-level operations, filesystem interactions, and process execution.
- **Inter-Process Communication (IPC)**: Tauri acts as the bridge, passing messages and commands asynchronously between the React frontend and the Rust backend.

---

## 2. Frontend Architecture

The frontend is built for speed, developer experience, and a premium aesthetic.

### Tech Stack
- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite for fast hot-module replacement and optimized builds.
- **Styling**: TailwindCSS combined with `shadcn/ui` and Radix UI primitives for accessible, customizable, and high-quality UI components.
- **State Management**: Zustand provides a lightweight, unopinionated centralized store (e.g., `projectStore.ts`).
- **Routing**: React Router handles page transitions (Home, Projects, Settings, Tools, etc.).

### Key Concepts
- **Custom Hooks**: Business logic is decoupled from UI components. Hooks like `useProjects.ts` handle calling Tauri commands and updating the Zustand store.
- **Component Design**: 
  - `components/ui/`: Reusable, generic UI primitives (buttons, dialogs, inputs) generated via `shadcn/ui`.
  - `components/Structure/`: Layout-specific components defining the app's skeleton (sidebar, header).

---

## 3. Backend Architecture

The backend is built in Rust to ensure memory safety, fast execution, and direct access to system APIs without the overhead of a Node.js backend.

### Tech Stack
- **Framework**: Tauri v2.
- **Concurrency**: `tokio` handles asynchronous tasks, ensuring the UI thread remains unblocked during heavy operations.
- **Error Handling**: Custom `AppError` and `AppResult` types (using `thiserror`) provide structured error messages that are easily serializable and understandable by the frontend.

### Command Modules
Tauri commands are grouped by domain to keep the codebase maintainable:

1. **`projects.rs`**
   - Handles the core business logic of scaffolding web projects (e.g., Next.js, Angular).
   - Executes shell commands (like `npx create-next-app` or `ng new`) safely via `execute_command`.
   - Manages project paths and directory deletion.

2. **`system.rs`**
   - Interacts with the host OS.
   - Provides utilities to open directories in native file explorers, VS Code, or system terminals.

3. **`cleanup.rs`**
   - Contains recursive cleanup logic (`clean_project`).
   - Identifies and removes heavy build folders (`node_modules`, `dist`, `.next`, `target`, etc.) to free up disk space.

---

## 4. Inter-Process Communication (IPC)

The frontend communicates with the Rust backend using Tauri's asynchronous command invocation. 

**Example Flow:**
1. User clicks "Clean Project" in the React UI.
2. The frontend calls `invoke("clean_project", { path: projectPath })`.
3. The IPC bridge serializes the payload and passes it to the Rust backend.
4. Rust executes the filesystem operations asynchronously.
5. Rust returns a `Result<String, AppError>`.
6. The frontend receives the success message or catches the error and displays a toast notification.

---

## 5. Directory Structure

```text
locally/
├── src/                    # React Frontend
│   ├── assets/             # Static assets (images, fonts)
│   ├── components/         # React components
│   │   ├── Structure/      # Layout components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks (e.g., useProjects)
│   ├── lib/                # Utility functions (e.g., tailwind merge)
│   ├── pages/              # Route components (Home, Projects, Settings)
│   ├── store/              # Zustand state stores
│   ├── types/              # TypeScript interfaces
│   ├── App.tsx             # Main React component
│   └── main.tsx            # React entry point
│
├── src-tauri/              # Rust Backend
│   ├── src/
│   │   ├── commands/       # Tauri IPC commands
│   │   │   ├── cleanup.rs  # Project cleanup logic
│   │   │   ├── projects.rs # Project creation and deletion
│   │   │   └── system.rs   # OS-level interactions
│   │   ├── config.rs       # Application configuration state
│   │   ├── lib.rs          # Tauri setup and plugin initialization
│   │   ├── main.rs         # Backend entry point
│   │   ├── types.rs        # Shared Rust types and Error handling
│   │   └── utils.rs        # Helper functions (command execution, sizes)
│   ├── tauri.conf.json     # Tauri configuration
│   └── Cargo.toml          # Rust dependencies
│
├── package.json            # Node.js dependencies and scripts
└── vite.config.ts          # Vite configuration
```
