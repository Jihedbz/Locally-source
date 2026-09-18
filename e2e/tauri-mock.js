;(() => {
  const storageKey = 'locally-e2e-projects'
  const appDataPath = 'C:/e2e/appdata'

  const readProjects = () => JSON.parse(localStorage.getItem(storageKey) || '[]')
  const writeProjects = (projects) => localStorage.setItem(storageKey, JSON.stringify(projects))

  window.__TAURI_INTERNALS__ = {
    invoke: async (command, args = {}) => {
      if (command === 'plugin:path|resolve_directory') return appDataPath
      if (command === 'plugin:path|join') return [args.paths].flat().join('/').replace(/\\/g, '/')

      if (command === 'plugin:fs|read_text_file') {
        const projects = readProjects()
        if (!projects.length) throw new Error('os error 2')
        return Array.from(new TextEncoder().encode(JSON.stringify(projects)))
      }

      if (command === 'plugin:fs|write_text_file') {
        const bytes = args instanceof Uint8Array ? args : Uint8Array.from(Object.values(args))
        const content = new TextDecoder().decode(bytes)
        writeProjects(JSON.parse(content))
        return null
      }

      if (command === 'create_next_project' || command === 'create_angular_project') {
        await new Promise((resolve) => setTimeout(resolve, 150))
        return 'Project created successfully.'
      }

      if (command === 'create_react_project' || command === 'create_vue_project') {
        await new Promise((resolve) => setTimeout(resolve, 150))
        return 'Project created successfully.'
      }

      if (
        command === 'open_in_explorer' ||
        command === 'open_in_vscode' ||
        command === 'open_terminal' ||
        command === 'clean_project' ||
        command === 'delete_project' ||
        command === 'get_operating_system'
      ) {
        return 'ok'
      }

      if (command === 'plugin:dialog|open') {
        return 'C:/e2e/imported-workspace'
      }

      if (command === 'detect_project_type') {
        return {
          name: 'Imported App',
          path: args.path || 'C:/e2e/imported-workspace',
          type: 'react',
          createdAt: new Date().toISOString(),
          hasPackageJson: true,
        }
      }

      if (command === 'scan_directory_for_projects') {
        return [
          {
            name: 'Sample Imported App',
            path: `${args.path || 'C:/e2e/imported-workspace'}/sample-app`,
            type: 'next',
            createdAt: new Date().toISOString(),
            hasPackageJson: true,
          },
        ]
      }

      if (command === 'get_git_status') {
        return {
          isRepo: true,
          branch: 'main',
          isClean: true,
          modifiedCount: 0,
          untrackedCount: 0,
          stagedCount: 0,
          lastCommitHash: 'a1b2c3d4e5f6',
          lastCommitAuthor: 'Developer',
          lastCommitMessage: 'feat: add git integration',
          lastCommitTimestamp: Math.floor(Date.now() / 1000) - 3600,
        }
      }

      if (command === 'git_fetch' || command === 'git_pull') {
        return 'Already up to date.'
      }

      if (command === 'get_last_modified') return Math.floor(Date.now() / 1000)
      if (command === 'get_dir_size') return 1024 * 1024
      if (command === 'plugin:clipboard-manager|write_text') return null

      throw new Error(`Unhandled E2E Tauri command: ${command}`)
    },
    transformCallback: () => 0,
    unregisterCallback: () => undefined,
  }
})()
