# Locally – Project Overview & Roadmap

## What Locally Is Today

Locally is a cross-platform desktop app built with Tauri 2 and React that helps developers manage local web projects from one place.

### ✅ Core features that are already in place
| Area | Status |
|---|---|
| Project CRUD | Working – create, browse, delete, and manage local project metadata |
| Project scaffolding | Working – React, Next.js, Angular, and Vue project creation flows |
| Local project details | Working – path, folder size, modified time, last active state |
| npm package management | Working – install, uninstall, search, outdated checks, and audit support |
| Cleanup workflows | Working – remove build artifacts, node_modules, and temporary folders |
| Open in Explorer / VS Code / terminal | Working cross-platform |
| Theme support | Working – light, dark, and system modes |
| Home overview cards | Working – project counts, disk usage, frameworks, recent items |
| CI and checks | Working – lint, build, test, and packaging pipeline |
| Developer utilities | Working – JSON, Base64, hash tools, and related helpers |
| Dev server controls | Working – start/stop dev server with real-time log output |

### ✅ Also already completed
Most of the app is now in a strong usable state. The remaining gaps are the ones we want to focus on next.

---

## Roadmap – Remaining work

### Priority 1 — product gaps

#### Git integration (branch, status, pull)
Add first-class Git visibility and actions for each project:
- current branch
- working tree status
- last commit summary
- quick actions: pull, status, maybe checkout/branch switch

#### Onboarding flow
Improve first-run experience:
- detect missing tools (Node/npm)
- show empty-state guidance
- recommend first project creation path
- offer quick import of an existing project folder

#### Dynamic version + changelog
- read app version from the Tauri config at runtime
- show release/build version in the UI
- connect changelog content to real releases instead of static text

#### Keyboard shortcuts
Add global shortcuts for speed and flow:
- quick project search
- open create-project flow
- toggle sidebar
- focus search / filters

---

### Priority 2 — quality & reliability

#### E2E test gap fill
Add end-to-end coverage beyond the basic happy paths:
- project create flow
- npm package install / uninstall
- settings interactions
- tools page workflows
- empty states and error states
- multi-project switching and project selection states

#### Rust backend tests
Expand backend verification for reliability:
- path validation and project security boundaries
- cleanup behavior and file deletion safety
- progress/cancel behavior for package and dev actions
- OS-specific command execution edge cases

---

### Priority 3 — future ideas and product improvements

#### Import existing projects / workspaces
Let users add already-created local apps without scaffolding them again.
- import folder from disk
- detect package.json / framework automatically
- merge into the project library cleanly

#### Better project health dashboard
Add an overview for each project:
- dev server status
- dependency health
- outdated package count
- build warnings
- last run / last error

#### More project templates
Support additional stacks:
- Svelte / SvelteKit
- Astro
- Nuxt
- blank app template
- monorepo-aware project setup

#### Bulk actions and smarter filtering
- multi-select project actions
- tag filtering and saved views
- pinned / archived / favorites views

#### Improved release and update UX
- release notes modal
- update prompts with changelog summary
- install/update notifications

---

## Recommendation

For the next cycle, the best focus is:
1. Git integration
2. E2E gap fill
3. Rust backend tests
4. Onboarding flow
5. Dynamic version + changelog
6. Keyboard shortcuts

That keeps the roadmap realistic, aligned with the app’s current maturity, and avoids spending time on features the product already does well.
