import { invoke } from '@tauri-apps/api/core'

export interface TauriError extends Error {
  code?: string
  command?: string
}

export class TauriCommandError extends Error implements TauriError {
  public code?: string
  public command?: string

  constructor(message: string, command?: string, code?: string) {
    super(message)
    this.name = 'TauriCommandError'
    this.command = command
    this.code = code
  }
}

/**
 * Wrapper for Tauri invoke calls with enhanced error handling
 */
export async function invokeWithErrorHandling<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    const result = await invoke<T>(command, args)
    return result
  } catch (error) {
    console.error(`Tauri command '${command}' failed:`, error)

    // Handle different types of errors
    if (error instanceof Error) {
      // Check if it's already a TauriCommandError
      if (error.name === 'TauriCommandError') {
        throw error
      }

      // Handle common Tauri error patterns
      if (error.message.includes('Command not found')) {
        throw new TauriCommandError(
          `Command '${command}' is not available. Please check if the backend is properly configured.`,
          command,
          'COMMAND_NOT_FOUND'
        )
      }

      if (error.message.includes('Permission denied')) {
        throw new TauriCommandError(
          `Permission denied while executing '${command}'. Please check file permissions.`,
          command,
          'PERMISSION_DENIED'
        )
      }

      if (error.message.includes('File not found')) {
        throw new TauriCommandError(
          `File not found while executing '${command}'. Please check if the file exists.`,
          command,
          'FILE_NOT_FOUND'
        )
      }

      // Generic error wrap
      throw new TauriCommandError(
        `Failed to execute '${command}': ${error.message}`,
        command,
        'UNKNOWN_ERROR'
      )
    }

    // Handle non-Error objects
    throw new TauriCommandError(
      `Unexpected error while executing '${command}': ${String(error)}`,
      command,
      'UNKNOWN_ERROR'
    )
  }
}

/**
 * Specific wrappers for common Tauri commands
 */
export const tauriCommands = {
  // Project operations
  createAngularProject: (name: string) =>
    invokeWithErrorHandling<string>('create_angular_project', { name }),

  createNextProject: (params: {
    name: string
    typescript: string
    eslint: string
    tailwind: string
    src: string
    appRouter: string
    turbopack: string
  }) => invokeWithErrorHandling<string>('create_next_project', params),

  deleteProject: (path: string) => invokeWithErrorHandling<string>('delete_project', { path }),

  openInExplorer: (path: string) => invokeWithErrorHandling<string>('open_in_explorer', { path }),

  openInVSCode: (path: string) => invokeWithErrorHandling<string>('open_in_vscode', { path }),

  openTerminal: (path: string) => invokeWithErrorHandling<string>('open_terminal', { path }),

  cleanProject: (path: string) => invokeWithErrorHandling<string>('clean_project', { path }),

  // Utility operations
  getOperatingSystem: () => invokeWithErrorHandling<string>('get_operating_system'),

  getLastModified: (dirPath: string) =>
    invokeWithErrorHandling<number | null>('get_last_modified', { dirPath }),

  getDirSize: (path: string) => invokeWithErrorHandling<number>('get_dir_size', { path }),
}

/**
 * Helper function to get user-friendly error messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TauriCommandError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

/**
 * Hook for handling Tauri command errors with user feedback
 */
export function useTauriErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    const message = getErrorMessage(error)
    console.error(`Tauri Error${context ? ` in ${context}` : ''}:`, error)
    return message
  }

  return { handleError }
}
