import { useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'

export interface TauriError extends Error {
  code?: string
  command?: string
}

export interface NpmPackage {
  name: string
  version: string
  dependencyType: 'production' | 'development'
}

export interface NpmSearchResult {
  name: string
  version: string
  description?: string
  packageType?: string
}

export interface NpmPackageMetadata {
  name: string
  version: string
  description?: string
  license?: string
  homepage?: string
  repository?: string
}

export interface NpmAvailability {
  installed: boolean
  version?: string
  online: boolean
  message?: string
}

export interface NpmProgressPayload {
  installId: string
  line: string
  stream: 'stdout' | 'stderr'
}

export interface NpmVulnerabilityAdvisory {
  name: string
  title?: string
  url?: string
  severity: 'info' | 'low' | 'moderate' | 'high' | 'critical' | string
  range?: string
  cwe: string[]
}

export interface NpmFixAvailable {
  name?: string
  version?: string
  isSemVerMajor?: boolean
}

export interface NpmVulnerabilityItem {
  name: string
  severity: 'info' | 'low' | 'moderate' | 'high' | 'critical' | string
  isDirect: boolean
  range?: string
  effects: string[]
  via: string[]
  fixAvailable?: NpmFixAvailable
  advisories: NpmVulnerabilityAdvisory[]
}

export interface NpmAuditSummary {
  info: number
  low: number
  moderate: number
  high: number
  critical: number
  total: number
  totalDependencies: number
}

export interface NpmAuditReport {
  summary: NpmAuditSummary
  vulnerabilities: NpmVulnerabilityItem[]
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

  createReactProject: (name: string) =>
    invokeWithErrorHandling<string>('create_react_project', { name }),

  createVueProject: (name: string) =>
    invokeWithErrorHandling<string>('create_vue_project', { name }),

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

  openInVSCode: (path: string, editor?: string, customEditorPath?: string) =>
    invokeWithErrorHandling<string>('open_in_vscode', { path, editor, customEditorPath }),

  openTerminal: (path: string, terminal?: string, customTerminalPath?: string) =>
    invokeWithErrorHandling<string>('open_terminal', { path, terminal, customTerminalPath }),

  cleanProject: (path: string) => invokeWithErrorHandling<string>('clean_project', { path }),

  // Utility operations
  getOperatingSystem: () => invokeWithErrorHandling<string>('get_operating_system'),

  getLastModified: (dirPath: string) =>
    invokeWithErrorHandling<number | null>('get_last_modified', { dirPath }),

  getDirSize: (path: string) => invokeWithErrorHandling<number>('get_dir_size', { path }),

  checkNpmAvailability: () => invokeWithErrorHandling<NpmAvailability>('check_npm_availability'),

  initPackageJson: (path: string) => invokeWithErrorHandling<string>('init_package_json', { path }),

  getNpmPackages: (path: string) =>
    invokeWithErrorHandling<NpmPackage[]>('get_npm_packages', { path }),

  searchNpmPackages: (query: string) =>
    invokeWithErrorHandling<NpmSearchResult[]>('search_npm_packages', { query }),

  getNpmPackageMetadata: (packageName: string, version: string) =>
    invokeWithErrorHandling<NpmPackageMetadata>('get_npm_package_metadata', {
      package: packageName,
      version,
    }),

  installNpmPackage: (params: {
    path: string
    package: string
    version?: string
    dev: boolean
    installId?: string
  }) =>
    invokeWithErrorHandling<string>('install_npm_package', {
      path: params.path,
      package: params.package,
      version: params.version,
      dev: params.dev,
      installId: params.installId,
    }),

  updateNpmPackage: (path: string, packageName: string, installId?: string) =>
    invokeWithErrorHandling<string>('update_npm_package', {
      path,
      package: packageName,
      installId,
    }),

  removeNpmPackage: (path: string, packageName: string, installId?: string) =>
    invokeWithErrorHandling<string>('remove_npm_package', {
      path,
      package: packageName,
      installId,
    }),

  cancelNpmInstall: (installId: string) =>
    invokeWithErrorHandling<boolean>('cancel_npm_install', { installId }),

  auditNpmPackages: (path: string) =>
    invokeWithErrorHandling<NpmAuditReport>('audit_npm_packages', { path }),

  fixNpmAudit: (params: { path: string; force?: boolean; installId?: string }) =>
    invokeWithErrorHandling<string>('fix_npm_audit', {
      path: params.path,
      force: params.force ?? false,
      installId: params.installId,
    }),
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
  const handleError = useCallback((error: unknown, context?: string) => {
    const message = getErrorMessage(error)
    console.error(`Tauri Error${context ? ` in ${context}` : ''}:`, error)
    return message
  }, [])

  return { handleError }
}
