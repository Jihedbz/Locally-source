# Locally — Project Analysis & Improved Roadmap

## Current State

Locally is a **Tauri 2 + React 18** desktop app that acts as a local-project manager for web developers. It's genuinely further along than most personal projects at this stage.

### What's Actually Working (confirmed in code)

| Area | Reality Check |
|---|---|
| Project CRUD + metadata | ✅ Solid — `projects.rs` is 45KB of real implementation |
| npm package management | ✅ Real — install, uninstall, search, outdated, audit with full vulnerability types |
| Cleanup workflows | ✅ Working `cleanup.rs` with artifact folder detection |
| Dev server controls | ✅ `ProcessManager` with proper kill/cancel across platforms |
| Error handling | ✅ Structured `AppError` + `format_npm_error` with human-readable messages |
| CI pipeline | ✅ Lint, type-check, Vitest, Playwright, Rust checks all hooked |
| Theme support | ✅ Light/dark/system |
| Framework scaffolding | ✅ Next.js, React/Vite, Vue/Vite, Angular |
| Developer tools page | ✅ JSON, Base64, hash utilities |

### Genuine Gaps (honest assessment)

- **No Git integration at all** — the biggest missing piece for a project manager
- **No project import** — you can only use projects *created* by the app, a major UX wall
- **Only 4 templates** — missing Svelte, Astro, Nuxt, Bun, and anything backend
- **Version pinning for scaffolded projects** — `npx create-next-app` always pulls latest, no control over versions
- **No persistent project notes/tags** — the data model is minimal (`name`, `path`, `type`, `created_at`, `pinned`)
- **Single workspace** — no concept of workspaces or grouping projects
- **E2E coverage is thin** — confirmed by roadmap; real-world npm flows are barely tested
- **No Rust-level streaming progress for project creation** — scaffolding is a black box until done

---

## Honest Opinion

**The foundation is genuinely strong.** The Rust backend is well-structured — typed errors, a real `ProcessManager`, cross-platform command execution, symlink-safe directory scanning. The TypeScript side is clean with Zustand + hooks properly separating concerns. The CI pipeline is production-grade.

**The hard truth** is that this is currently a very good *internal tool* but not yet a compelling *product*. The core loop — create project → manage packages → run dev server — works, but the app misses the workflows that would make a developer actually switch to it daily:

1. **You can't import existing projects.** Every developer already has a `~/Projects` folder. Being unable to just point Locally at it and have it manage those projects is the single biggest friction point.
2. **There's no Git visibility.** Branch/status/last commit is table stakes for a project manager. Without it, developers will keep a terminal open anyway.
3. **The project data model is too thin.** No tags, no custom notes, no workspace grouping. It treats every project the same way.

**The potential is real.** The Tauri + Rust approach is architecturally right for this kind of tool. It's fast, native, and memory-safe. Tools like Herd, Laragon, and DevKinsta prove there's a market for local dev environment managers. But those focus on servers; Locally's niche — *project-level* management with npm lifecycle support — is actually underserved.

---

## Improved Roadmap

### 🔴 Priority 1 — Remove the biggest blockers

#### 1.1 Import existing projects
This is the single highest-ROI feature. Without it, adoption is near-zero for anyone with existing work.
- Folder picker using `@tauri-apps/plugin-dialog`
- Auto-detect framework from `package.json` (`next`, `vite`, `@angular/core`, etc.)
- Detect Rust via `Cargo.toml`, Python via `pyproject.toml` (future-proofs the app)
- Batch import: scan a root folder and import all valid projects at once

#### 1.2 Git integration
- Current branch, dirty/clean status, last commit message + author + time
- Quick actions: `pull`, `fetch`, `status` (read-only to start)
- Surface in project card *and* project detail view
- Use `git` CLI via `execute_command` — no need for a git2 crate dependency yet

#### 1.3 Onboarding + first-run experience
- Detect Node, npm, git, Rust on first launch
- Show clear install links for anything missing
- Offer "Import your existing projects folder" as the primary first-run CTA

---

### 🟡 Priority 2 — Make it stickier

#### 2.1 Richer project data model
Add to the `Project` struct:
- `tags: Vec<String>` — user-defined labels
- `notes: Option<String>` — a small free-text field
- `last_opened: Option<String>` — track when they last touched it
- `color: Option<String>` — accent color for visual scanning

#### 2.2 Workspace / folder grouping
- Let users define named workspaces (e.g., "Client Work", "Side Projects")
- Filter sidebar by workspace
- Physical folder becomes the natural workspace if you do batch import right

#### 2.3 Keyboard-first UX
- `Cmd/Ctrl + K` — command palette (already have `cmdk` in `package.json`!)
- `Cmd/Ctrl + N` — new project
- `Cmd/Ctrl + F` — focus search
- Global shortcuts via Tauri's globalShortcut plugin

#### 2.4 Real-time scaffolding progress
- Stream `stdout`/`stderr` from `npx create-*` using the existing `ProcessManager`
- Show a live log during project creation (same as dev server log already does)
- This already works for dev server — apply the same pattern to project creation

#### 2.5 Dynamic version + changelog
- Read version from `tauri.conf.json` at build time and inject via Vite env var
- Show in Settings page
- Add a modal for release notes on first launch after update

---

### 🟢 Priority 3 — Differentiation features

#### 3.1 Project health snapshot
A per-project dashboard card showing:
- Outdated packages count (from existing `npm outdated` support)
- Audit vulnerabilities count (already have `NpmAuditReport` type!)
- Dev server status (running/stopped)
- Last git commit time
- Disk usage trend

This is low-effort because most of the data already exists — it just needs to be surfaced.

#### 3.2 More templates
- SvelteKit (`npm create svelte@latest`)
- Astro (`npm create astro@latest`)
- Nuxt (`npx nuxi@latest init`)
- T3 stack (`npm create t3-app@latest`)
- Bun + Elysia (backend)
- Blank HTML/CSS (no bundler)
- Custom template from local folder

#### 3.3 Environment variable manager
- Read/write `.env` files per project
- Show which variables are set vs. missing (compare to `.env.example`)
- Never store secrets in app state — read directly from disk on demand

#### 3.4 Multi-project bulk actions
- Select multiple projects → Clean all, Update all packages, Pull all repos
- This becomes very powerful once Git integration is in

#### 3.5 Process / port monitor
- Show which projects have a dev server running + which port
- Detect port conflicts before starting
- Kill a port from the UI

---

### 🔵 Priority 4 — Platform & quality

#### 4.1 Auto-update
- Tauri's built-in updater plugin
- Show changelog modal on update
- Background check on launch

#### 4.2 E2E gap fill
- Project import flow
- npm install/uninstall with a real test project fixture
- Git status display
- Settings persistence

#### 4.3 Rust backend hardening
- Path traversal security tests (ensure no escape from managed paths)
- Cleanup rollback on partial failure
- Streaming scaffolding with cancellation

---

## Unique Feature Ideas (Differentiation)

These don't exist in any comparable tool today:

| Feature | Why it's unique |
|---|---|
| **"Last touched" timeline** | A chronological view of which projects you've actually worked on, surfacing stale ones automatically |
| **Dependency overlap map** | Show which packages are shared across projects — helps when maintaining multiple apps |
| **"Cold project" warnings** | Flag projects that have critical vulnerabilities, outdated Node engine requirements, or haven't been updated in N months |
| **Port registry** | A global view of which projects use which ports (read from `package.json` scripts / vite configs) |
| **Clipboard-aware package installer** | Detect when you copy `npm install some-package` from a browser and offer a one-click install into the selected project |
| **Project duplication / clone** | Clone a local project to a new folder with a new name, keeping the git history optional |
| **Script runner** | Browse and run any `package.json` script from the UI without opening a terminal |
| **Offline badge** | Visual indicator on projects whose last audit/outdated check couldn't reach the registry |

---

## Summary Verdict

Locally has a **solid technical core and a real product niche**. The Tauri + Rust architecture is the right choice and is executed cleanly. The gap between "works well" and "compelling daily driver" is primarily **import existing projects** and **Git visibility** — fix those two things first and the utility of everything else multiplies significantly.

The roadmap above is ordered by impact-per-effort, not by ambition.
