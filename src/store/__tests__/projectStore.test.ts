import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjectStore } from '../projectStore'

// Mock Tauri plugin-fs
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  BaseDirectory: { AppData: 'app-data' }
}))

import { readTextFile } from '@tauri-apps/plugin-fs'

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.getState().setProjects([])
    useProjectStore.getState().setSelectedProject(null)
    useProjectStore.getState().setSearchQuery('')
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const state = useProjectStore.getState()
    expect(state.projects).toEqual([])
    expect(state.selectedProject).toBeNull()
    expect(state.searchQuery).toBe('')
    expect(state.viewMode).toBe('grid')
  })

  it('should update search query', () => {
    useProjectStore.getState().setSearchQuery('test query')
    expect(useProjectStore.getState().searchQuery).toBe('test query')
  })

  it('should update view mode', () => {
    useProjectStore.getState().setViewMode('list')
    expect(useProjectStore.getState().viewMode).toBe('list')
  })

  it('should load projects successfully', async () => {
    const mockProjects = [{ name: 'Project 1', path: '/path/1', type: 'react', createdAt: '', pinned: false }]
    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(mockProjects))

    await useProjectStore.getState().loadProjects()

    expect(useProjectStore.getState().projects).toEqual(mockProjects)
    expect(useProjectStore.getState().isLoading).toBe(false)
  })

  it('should handle error when loading projects', async () => {
    vi.mocked(readTextFile).mockRejectedValue(new Error('File not found'))

    await useProjectStore.getState().loadProjects()

    expect(useProjectStore.getState().projects).toEqual([])
    expect(useProjectStore.getState().isLoading).toBe(false)
  })

  it('should set selected project', () => {
    const mockProject = { name: 'Project 1', path: '/path/1', type: 'react', createdAt: '', pinned: false }
    useProjectStore.getState().setSelectedProject(mockProject as any)
    expect(useProjectStore.getState().selectedProject).toEqual(mockProject)
  })
})
