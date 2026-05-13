import { describe, expect, it, beforeEach } from 'vitest'
import { useSettingsStore } from '../settingsStore'

describe('Settings Store', () => {
  beforeEach(() => {
    // Reset the store to defaults
    const store = useSettingsStore.getState()
    store.resetToDefaults()
  })

  it('should initialize with default settings', () => {
    const settings = useSettingsStore.getState()

    expect(settings.theme).toBe('system')
    expect(settings.defaultProjectPath).toBe('')
    expect(settings.preferredEditor).toBe('vscode')
    expect(settings.autoCheckUpdates).toBe(true)
    expect(settings.sidebarCollapsed).toBe(false)
  })

  it('should update settings', () => {
    const store = useSettingsStore.getState()

    store.updateSettings({
      theme: 'dark',
      defaultProjectPath: '/home/user/projects',
      sidebarCollapsed: true,
    })

    const updatedSettings = useSettingsStore.getState()
    expect(updatedSettings.theme).toBe('dark')
    expect(updatedSettings.defaultProjectPath).toBe('/home/user/projects')
    expect(updatedSettings.sidebarCollapsed).toBe(true)
  })

  it('should reset to defaults', () => {
    const store = useSettingsStore.getState()

    // First update some settings
    store.updateSettings({
      theme: 'light',
      preferredEditor: 'webstorm',
    })

    // Then reset
    store.resetToDefaults()

    const resetSettings = useSettingsStore.getState()
    expect(resetSettings.theme).toBe('system')
    expect(resetSettings.preferredEditor).toBe('vscode')
  })
})
