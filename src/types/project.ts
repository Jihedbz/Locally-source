export interface Project {
  name: string
  path: string
  type: ProjectType
  createdAt: string
  pinned: boolean
  tags?: string[]
}

export type ProjectType =
  | 'angular'
  | 'react'
  | 'next'
  | 'vue'
  | 'rust'
  | 'python'
  | 'go'
  | 'svelte'
  | 'astro'
  | 'other'
  | string

export interface DiscoveredProject {
  name: string
  path: string
  type: ProjectType
  createdAt: string
  hasPackageJson: boolean
}

export interface GitStatusReport {
  isRepo: boolean
  branch?: string
  isClean: boolean
  modifiedCount: number
  untrackedCount: number
  stagedCount: number
  lastCommitHash?: string
  lastCommitAuthor?: string
  lastCommitMessage?: string
  lastCommitTimestamp?: number
}

export interface ProjectAction {
  label: string
  icon: string
  action: () => void | Promise<void>
}

export interface ProjectActionsProps {
  project: Project
  projects: Project[]
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
}

export interface ProjectDetailsProps {
  selectedProject: Project
}
