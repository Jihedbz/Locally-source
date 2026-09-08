import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjectStore } from '../projectStore'
import { Project } from '@/types/project'

// Mock Tauri plugin-fs
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  BaseDirectory: { AppData: 'app-data' },
}))

import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

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
    const mockProjects = [
      { name: 'Project 1', path: '/path/1', type: 'react', createdAt: '', pinned: false },
    ]
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
    const mockProject: Project = {
      name: 'Project 1',
      path: '/path/1',
      type: 'react',
      createdAt: '',
      pinned: false,
    }
    useProjectStore.getState().setSelectedProject(mockProject)
    expect(useProjectStore.getState().selectedProject).toEqual(mockProject)
  })

  it('should reject duplicate project names without changing state', async () => {
    const existingProject: Project = {
      name: 'Project 1',
      path: '/path/1',
      type: 'react',
      createdAt: '',
      pinned: false,
    }
    const duplicateProject: Project = {
      name: ' project 1 ',
      path: '/path/2',
      type: 'next',
      createdAt: '',
      pinned: false,
    }
    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify([existingProject]))

    await expect(useProjectStore.getState().addProject(duplicateProject)).rejects.toThrow(
      'already exists'
    )
    expect(writeTextFile).not.toHaveBeenCalled()
    expect(useProjectStore.getState().projects).toEqual([])
  })

  it('updates state only after project metadata is written', async () => {
    const project: Project = {
      name: 'Project 2',
      path: '/path/2',
      type: 'next',
      createdAt: '',
      pinned: false,
    }
    vi.mocked(readTextFile).mockRejectedValue(new Error('os error 2'))
    vi.mocked(writeTextFile).mockResolvedValue(undefined)

    await useProjectStore.getState().addProject(project)

    expect(writeTextFile).toHaveBeenCalledOnce()
    expect(useProjectStore.getState().projects).toEqual([project])
  })
})
