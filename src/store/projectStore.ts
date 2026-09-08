import { create } from 'zustand'
import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs'
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
  addProject: (project: Project) => Promise<void>
  saveProjects: (projects: Project[]) => Promise<void>
}

const PROJECTS_FILE = 'projects/projects.json'

const isMissingProjectsFile = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('File not found') ||
    message.includes('os error 2') ||
    message.toLowerCase().includes('cannot find the file')
  )
}

const readProjects = async (): Promise<Project[]> => {
  try {
    const data = await readTextFile(PROJECTS_FILE, { baseDir: BaseDirectory.AppData })
    const projects = JSON.parse(data)
    if (!Array.isArray(projects)) {
      throw new Error('Project metadata must be an array')
    }
    return projects as Project[]
  } catch (error) {
    if (isMissingProjectsFile(error)) return []
    throw error
  }
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
      set({ projects: await readProjects(), isLoading: false })
    } catch (error) {
      set({ projects: [], isLoading: false })
      throw error
    }
  },

  addProject: async (project) => {
    const projects = await readProjects()
    const duplicate = projects.some(
      (existingProject) =>
        existingProject.name.trim().toLowerCase() === project.name.trim().toLowerCase()
    )
    if (duplicate) {
      throw new Error(`A project named "${project.name}" already exists.`)
    }

    const updatedProjects = [...projects, project]
    await writeTextFile(PROJECTS_FILE, JSON.stringify(updatedProjects, null, 2), {
      baseDir: BaseDirectory.AppData,
      create: true,
    })
    set({ projects: updatedProjects })
  },

  saveProjects: async (projects) => {
    await writeTextFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), {
      baseDir: BaseDirectory.AppData,
      create: true,
    })
    set({ projects })
  },
}))
