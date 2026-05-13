import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppSettings {
  // Theme settings
  theme: 'light' | 'dark' | 'system'
  // Project settings
  defaultProjectPath: string
  // Editor settings
  preferredEditor: 'vscode' | 'cursor' | 'webstorm' | 'custom'
  customEditorPath: string
  // Terminal settings
  preferredTerminal: 'default' | 'custom'
  customTerminalPath: string
  // Update settings
  autoCheckUpdates: boolean
  // UI settings
  sidebarCollapsed: boolean
  // Development settings
  showDevTools: boolean
}

interface SettingsStore extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void
  resetToDefaults: () => void
}

const defaultSettings: AppSettings = {
  theme: 'system',
  defaultProjectPath: '',
  preferredEditor: 'vscode',
  customEditorPath: '',
  preferredTerminal: 'default',
  customTerminalPath: '',
  autoCheckUpdates: true,
  sidebarCollapsed: false,
  showDevTools: false,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateSettings: (newSettings) =>
        set((state) => ({
          ...state,
          ...newSettings,
        })),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'locally-settings',
    }
  )
)
