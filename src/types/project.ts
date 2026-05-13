export interface Project {
  name: string
  path: string
  type: ProjectType
  createdAt: string
  pinned: boolean
}

export type ProjectType = 'angular' | 'react' | 'next' | 'vue' | 'other'

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
