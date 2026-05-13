# Locally - Desktop Project Manager

Locally is a modern, cross-platform desktop application designed to streamline the lifecycle of web development projects. Built with Tauri, React, and TypeScript, it allows developers to quickly scaffold, manage, and clean their projects from a central, beautifully designed interface.

For a detailed technical breakdown, please see the [Architecture Documentation](architecture.md).

## What it Does (Features)

- **Project Scaffolding**: Quickly create new web projects (like Next.js and Angular) with custom configurations straight from the UI.
- **Centralized Dashboard**: View and manage all your development projects in one place.
- **Deep System Integration**: 
  - Open projects instantly in VS Code.
  - Launch native system terminals directly at the project path.
  - Open projects in your OS's native file explorer.
- **One-Click Cleanup**: Automatically detect and remove heavy build artifacts and dependency folders (`node_modules`, `dist`, `.next`, `target`, etc.) to free up disk space.
- **Cross-Platform**: Provides a native-feeling experience across Windows, macOS, and Linux.

## Tech Stack

- **Frontend**: React 18.3, TypeScript, Vite, TailwindCSS, shadcn/ui, Zustand
- **Backend**: Rust, Tauri v2, Tokio
- **Testing**: Vitest, React Testing Library, Playwright

## Development Setup

### Prerequisites

- Node.js 18+
- Rust 1.70+
- OS-specific dependencies:
  - **Linux**: `sudo apt-get install libwebkit2gtk-4.0-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`
  - **macOS/Windows**: Provided by default with Rust/C++ build tools.

### Installation & Running

```bash
# Clone the repository
git clone <repository-url>
cd locally

# Install frontend dependencies
npm install

# Start the application in development mode
# This starts the Vite dev server and the Tauri Rust backend simultaneously.
npm run tauri dev
```

## How to Test it

Locally includes comprehensive testing setups for both the frontend components and the end-to-end user flows.

### 1. Unit & Component Testing (Frontend)
We use Vitest and React Testing Library to test React components and hooks.

```bash
# Run tests once
npm run test:run

# Run tests in watch mode (for active development)
npm run test

# Run tests with the Vitest UI
npm run test:ui
```

### 2. End-to-End (E2E) Testing
We use Playwright to simulate real user interactions and test the full application flow.

```bash
# Run all E2E tests
npx playwright test

# Run Playwright tests with the UI mode
npx playwright test --ui
```

### 3. Backend (Rust) Testing
You can test the core Rust logic directly using Cargo.

```bash
# Navigate to the backend directory
cd src-tauri

# Run tests
cargo test
```

### 4. Code Quality
Ensure your code meets the quality standards before submitting changes:

```bash
npm run lint         # Check for ESLint issues
npm run format:check # Check Prettier formatting
npm run type-check   # Validate TypeScript types
cargo check          # Validate Rust types and lifetimes (in src-tauri)
```

## Roadmap

- [x] Backend modularization
- [x] Frontend state management refactoring
- [x] Performance optimizations
- [ ] Settings page implementation
- [ ] Tools page with developer utilities
- [ ] Git integration
- [ ] Custom project templates
- [ ] Enhanced error handling

## License

MIT License - Copyright (c) 2024 Locally Team
