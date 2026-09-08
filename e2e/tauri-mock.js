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

      if (command === 'get_last_modified') return Math.floor(Date.now() / 1000)
      if (command === 'get_dir_size') return 1024 * 1024
      if (command === 'plugin:clipboard-manager|write_text') return null

      throw new Error(`Unhandled E2E Tauri command: ${command}`)
    },
    transformCallback: () => 0,
    unregisterCallback: () => undefined,
  }
})()
