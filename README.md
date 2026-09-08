# Locally

Locally is a cross-platform desktop project manager for local web development. It combines a React interface with a Rust/Tauri backend so developers can create, inspect, open, clean, and maintain projects from one workspace.

See [architecture.md](architecture.md) for the system structure and IPC design.

## Features

### Project workspace

- Browse projects in grid or list view.
- Search by project name or framework.
- Pin projects and inspect metadata such as location, size, creation date, and last modification.
- Open a project in the native file explorer, VS Code, or a terminal.
- Clean common generated folders and files, including `node_modules`, `dist`, `.next`, `target`, and coverage output.
- Delete projects with managed-path validation.

### Project creation

Create projects from the **New project** menu:

- Next.js
- Angular
- React with Vite and TypeScript
- Vue with Vite and TypeScript

Project metadata is persisted in the Tauri app-data directory under `projects/projects.json` and is updated in the Zustand store only after a successful write. Duplicate project names are rejected.

### npm package management

From a selected project, open **Manage npm packages** to:

- List production and development dependencies from `package.json`.
- Inspect package metadata such as description, license, homepage, and version.
- Search the npm registry.
- Install packages as production or development dependencies.
- Install a specific version, update to latest, or remove a package.
- Refresh the installed package list with loading, empty, and failure states.

### Interface

- Responsive layout for the default `1200x700` window, smaller supported sizes, and fullscreen.
- Sticky app header and package-details panels where appropriate.
- Collapsible sidebar with active-route highlighting and collapsed-state tooltips.
- Local Devicon framework icons for project cards, details, and creation menus.
- Light, dark, and system theme modes.

## Technology

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Zustand
- **Desktop backend**: Rust, Tauri 2.11, Tokio
- **Icons**: Devicon and Lucide
- **Testing**: Vitest, React Testing Library, Playwright, Rust tests
- **Quality**: ESLint, Prettier, TypeScript, GitHub Actions CI

## Requirements

- Node.js and npm
- Rust stable with the Tauri desktop prerequisites
- Windows: Microsoft WebView2 and the Visual Studio C++ build tools
- macOS: Xcode Command Line Tools
- Linux: WebKitGTK and Tauri system dependencies. On Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.0-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

The npm CLI must be available on the system for project scaffolding and package management. The app invokes `npx`/`npm` with direct arguments and does not require globally installed framework CLIs.

## Development

Install dependencies:

```bash
npm install
```

Run the desktop application:

```bash
npm run tauri dev
```

Run only the Vite frontend:

```bash
npm run dev
```

The Vite development server uses port `1420`, matching the Tauri configuration.

## Validation Commands

Frontend unit tests:

```bash
npm run test:run
npm run test       # watch mode
npm run test:ui    # Vitest UI
```

Browser workflows:

```bash
npm run test:e2e:install
npm run test:e2e
```

Playwright starts Vite automatically and uses a browser-only Tauri IPC mock. Desktop behavior should also be verified with `npm run tauri dev`.

Rust checks:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
```

Full frontend quality gate:

```bash
npm run format:check
npm run lint
npm run type-check
npm run build
```

These checks also run in GitHub Actions for pushes and pull requests. The CI workflow installs the pinned Playwright Chromium browser before running E2E tests.

## Project Layout

```text
src/                         React frontend
src/components/              Shared UI and application structure
src/pages/                   Home, projects, package management, settings, tools
src/hooks/                   Frontend business logic
src/lib/                     Tauri wrappers and utilities
src/store/                   Zustand state and persistence actions
src-tauri/src/commands/      Rust IPC commands
src-tauri/src/types.rs       Serializable backend types and errors
e2e/                         Playwright browser workflows
.github/workflows/           Quality and release workflows
```

## Current Priorities

- Improve desktop runtime diagnostics when npm or a framework CLI is unavailable.
- Expand npm package-management tests against real projects.
- Add Git integration and custom project templates.
- Continue improving release packaging and cross-platform verification.
