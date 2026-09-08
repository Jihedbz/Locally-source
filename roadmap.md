# Locally – Project Overview & Roadmap

## What Locally Is Today

Locally is a cross-platform desktop app (Tauri 2 + React 18) that acts as a local web project manager. After reviewing every layer of the codebase, here's the honest current state:

### ✅ What's Solid
| Area | Status |
|---|---|
| Project CRUD (create / delete / browse) | Working – React+Next+Angular+Vue scaffolding via npx |
| Project metadata panel | Working – path, size, modified date, age |
| npm package management | Just hardened – availability check, missing package.json, progress streaming, cancellation |
| Cleanup command | Solid – removes node_modules, dist, .next, target, etc. |
| Open in explorer / VS Code / terminal | Working cross-platform |
| Theme (light / dark / system) | Working |
| CI pipeline | Works – lint, type-check, Vitest, Playwright, Tauri publish |
| Developer Toolkit | Basic – JSON formatter, Base64, SHA hash generator |

### ⚠️ What's Incomplete or Stubs
| Area | Problem |
|---|---|
| Settings page | All preferences (editor choice, terminal, default path) are **saved in Zustand only** – they are never wired to any actual Rust command. Selecting "Cursor" or a custom terminal does nothing. |
| "Watch Demo" button on Home | Dead button – no demo or tour exists |
| Auto-update toggle in Settings | Wired to state but never invokes a Tauri updater |
| Tools page | Only 3 utilities – missing many developer workflow tools |
| Home page stats | Hardcoded ("4+ Framework Types", "3 Platforms") – not dynamic |
| E2E test coverage | Only 4 tests; no coverage of npm management, settings, or tools |
| `open_in_vscode` | Hardcoded to `code` – ignores the preferred editor setting |
| `open_terminal` | Hardcoded to system terminal – ignores the preferred terminal setting |
| Duplicate `format_size` function | Defined in both `utils.rs` and `cleanup.rs` – dead code |

---

## Roadmap

### 🔴 Phase 1 – Fix What's Broken (Immediate)

These are things that look complete in the UI but silently don't work.

#### 1.1 Wire Settings to the Backend
- **Preferred Editor**: Make `open_in_vscode` read from the settings store. Support VS Code, Cursor, Webstorm, and a custom binary path.
- **Preferred Terminal**: Make `open_terminal` on Linux and Windows respect the configured terminal. Add Windows Terminal support (`wt.exe`).
- **Default Project Path**: Currently ignored. The Rust path initializer should respect a custom user-configured root.

#### 1.2 Fix `open_in_vscode` / `open_terminal` on Windows
`open_in_vscode` runs `cmd /C code path` which blocks on Windows until the process exits. Should use `start /B` or `CREATE_NO_WINDOW`.

#### 1.3 Remove Duplicate `format_size`
`cleanup.rs` duplicates the function from `utils.rs`. Remove the local definition and use the shared one.

#### 1.4 Auto-Update
Either implement the Tauri updater plugin properly or remove the toggle from Settings to avoid confusion.

---

### 🟡 Phase 2 – Core Feature Gaps (High Value)

#### 2.1 Git Integration
The README calls this out as a priority. Each project detail panel should show:
- Current branch name
- Uncommitted changes count
- Last commit message + timestamp
- Quick actions: `git pull`, `git status`

This can be done entirely in Rust with `git2` crate or by running `git` subprocess commands.

#### 2.2 Project Run / Dev Server
Add a **"Run"** button per project that launches `npm run dev` in a background process and streams stdout into an in-app terminal panel. This completes the "project manager" promise – users don't need to open a separate terminal at all.

#### 2.3 Custom Project Templates
Currently: only Next.js, Angular, React (Vite), Vue (Vite).

Add support for:
- Svelte / SvelteKit
- Astro
- Nuxt
- Blank (empty `package.json` with custom name)
- **Import existing project** – add a folder that already exists on disk to the managed library without creating it.

#### 2.4 npm Audit & Vulnerability Panel
Inside the package management page, add a "Security audit" section that runs `npm audit --json` and surfaces:
- Severity breakdown (critical / high / moderate)
- Per-package advisories
- One-click `npm audit fix`

#### 2.5 Outdated Packages View
Add a tab or badge next to packages showing which ones have newer versions (`npm outdated --json`). Allow bulk update.

---

### 🟢 Phase 3 – Usability Polish

#### 3.1 Home Page – Real Stats
Replace hardcoded stats with live counts from the Zustand store:
- Total projects
- Total disk space used
- Frameworks breakdown (how many React vs Next vs Vue)
- Last active project

#### 3.2 Expand the Developer Toolkit
The Tools page currently only has 3 utilities. Add:
- **URL encode/decode** – very common for API debugging
- **JWT decoder** – paste a JWT and inspect headers/payload
- **Color converter** – HEX ↔ RGB ↔ HSL (useful for CSS work)
- **Regex tester** – live match highlighting
- **Diff viewer** – paste two text blocks and diff them

#### 3.3 Notification System
Replace the current `confirm()` dialogs (native browser alerts) with proper in-app confirmation dialogs using Radix UI Dialog. Currently `confirm()` blocks the renderer thread and looks very out-of-place.

#### 3.4 Project Tags / Categories
Allow tagging projects (e.g. "client work", "personal", "archived") and filter by tag in the projects view.

#### 3.5 Keyboard Shortcuts
Add global keyboard shortcuts:
- `Ctrl+K` – spotlight search across projects
- `Ctrl+N` – open "New project" menu
- `Ctrl+/` – toggle sidebar

---

### 🔵 Phase 4 – Quality & Reliability

#### 4.1 E2E Test Coverage
Current: 4 tests, zero coverage for npm management, settings, or tools.
Add Playwright tests for:
- npm availability banner
- Package search + install flow
- Settings save/reset
- Tools page (all 3 utilities)
- Missing package.json empty state

#### 4.2 Rust Backend Test Coverage
Currently only `validate_project_name` and `format_npm_error` are tested.
Add tests for:
- `get_managed_project_path` security boundary
- `clean_project` (temp files counting)
- `execute_npm_with_progress` cancellation path
- `check_npm_availability` with offline mocking

#### 4.3 Cross-Platform Verification
The CI build matrix covers macOS (ARM + Intel), Ubuntu, and Windows. However, the `open_terminal` on Linux auto-detects `gnome-terminal → konsole → xterm`. Add a CI step that runs `cargo test` on all three platforms to catch OS-specific regressions early.

#### 4.4 Error Boundary per Page
There's a top-level `ErrorBoundary` but sub-pages can still crash silently. Add granular boundaries per page route so a crash in npm management doesn't take down the whole app.

---

### 🟣 Phase 5 – Release Readiness

#### 5.1 App Version + Changelog
The Home page shows "Early Alpha" badge. Wire this dynamically from `tauri.conf.json` version. Update the Changelog page automatically from git tags.

#### 5.2 Onboarding Flow
First-launch: detect if `npm` is installed, if any projects exist, and guide the user to create their first project. Currently the app just shows an empty state.

#### 5.3 Telemetry / Crash Reporting (Optional)
Consider adding opt-in error reporting (e.g. Sentry with `@sentry/tauri`) so crashes in the wild are captured without the user having to manually report them.

---

## Feature Priority Summary

| Priority | Feature | Effort |
|---|---|---|
| 🔴 Immediate | Wire settings to backend (editor, terminal) | Medium |
| 🔴 Immediate | Fix Windows terminal open blocking | Small |
| 🔴 Immediate | Remove duplicate `format_size` | Tiny |
| 🟡 High | Git integration (branch, status, pull) | Large |
| 🟡 High | Run dev server with in-app terminal | Large |
| 🟡 High | Import existing project | Medium |
| 🟡 High | npm audit & vulnerability panel | Medium |
| 🟡 High | Outdated packages view | Small |
| 🟢 Medium | Confirmation dialogs (replace `confirm()`) | Small |
| 🟢 Medium | Live Home stats | Small |
| 🟢 Medium | Expand Tools (JWT, regex, diff) | Medium |
| 🟢 Medium | Project tags & filtering | Medium |
| 🔵 Quality | E2E test gap fill | Medium |
| 🔵 Quality | Rust backend tests | Medium |
| 🟣 Release | Onboarding flow | Medium |
| 🟣 Release | Dynamic version + changelog | Small |
