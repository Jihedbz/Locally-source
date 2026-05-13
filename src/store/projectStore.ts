import { create } from 'zustand'
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { Project } from '@/types/project'

interface ProjectState {
  projects: Project[]
  selectedProject: Project | null
  searchQuery: string
  viewMode: 'grid' | 'list'
  isLoading: boolean
  
  // Actions
  setProjects: (projects: Project[]) => void
  setSelectedProject: (project: Project | null) => void
  setSearchQuery: (query: string) => void
  setViewMode: (mode: 'grid' | 'list') => void
  loadProjects: () => Promise<void>
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProject: null,
  searchQuery: '',
  viewMode: 'grid',
  isLoading: false,

  setProjects: (projects) => set({ projects }),
  setSelectedProject: (project) => set({ selectedProject: project }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode }),

  loadProjects: async () => {
    set({ isLoading: true })
    try {
      const data = await readTextFile('projects/projects.json', {
        baseDir: BaseDirectory.AppData,
      })
      set({ projects: JSON.parse(data), isLoading: false })
    } catch (error) {
      console.log('No projects found, initializing empty list.')
      set({ projects: [], isLoading: false })
    }
  },
}))
