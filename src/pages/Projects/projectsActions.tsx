import React, { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { FolderOpen, Pin, Trash2, Recycle, Terminal, ExternalLink } from 'lucide-react'
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { useAlertStore } from '@/store/alertStore'
import { tauriCommands, useTauriErrorHandler } from '@/lib/tauriUtils'
import { Project } from '@/types/project'
import { useProjectStore } from '@/store/projectStore'

const ProjectActions: React.FC = () => {
  const PROJECTS_FILE = 'projects/projects.json'
  const { show } = useAlertStore()
  const { handleError } = useTauriErrorHandler()
  const { projects, setProjects, selectedProject: project } = useProjectStore()

  useEffect(() => {
    const getOperatingSystem = async () => {
      try {
        await tauriCommands.getOperatingSystem()
      } catch (error) {
        handleError(error, 'getting OS information')
      }
    }

    getOperatingSystem()
  }, [handleError])

  const saveProjects = useCallback(async (updatedProjects: Project[]) => {
    try {
      await writeTextFile(PROJECTS_FILE, JSON.stringify(updatedProjects, null, 2), {
        baseDir: BaseDirectory.AppData,
      })
    } catch (error) {
      console.error('Failed to save project list:', error)
      show('error', 'Error saving project list!')
    }
  }, [show])

  const handleOpenInExplorer = useCallback(async (path: string) => {
    if (!project) return
    try {
      await tauriCommands.openInExplorer(path)
      show('success', `Opened ${project.name} in Explorer.`)
    } catch (error) {
      const message = handleError(error, 'opening in Explorer')
      show('error', `Failed to open ${project.name} in Explorer: ${message}`)
    }
  }, [project, show, handleError])

  const handleOpenInVSCode = useCallback(async (path: string) => {
    if (!project) return
    try {
      await tauriCommands.openInVSCode(path)
      show('success', `Opened ${project.name} in VS Code.`)
    } catch (error) {
      const message = handleError(error, 'opening in VS Code')
      show('error', `Failed to open ${project.name} in VS Code: ${message}`)
    }
  }, [project, show, handleError])

  const handleOpenTerminal = useCallback(async (path: string) => {
    if (!project) return
    try {
      await tauriCommands.openTerminal(path)
      show('success', `Opened terminal in ${project.name}.`)
    } catch (error) {
      const message = handleError(error, 'opening terminal')
      show('error', `Failed to open terminal for ${project.name}: ${message}`)
    }
  }, [project, show, handleError])

  const handleCleanProject = useCallback(async (path: string) => {
    if (!project) return
    try {
      const confirmed = confirm(
        `Clean ${project.name}? This removes node_modules, build output, and temporary files.`
      )
      if (!confirmed) return

      await tauriCommands.cleanProject(path)
      show('success', `${project.name} has been cleaned.`)
    } catch (error) {
      const message = handleError(error, 'cleaning project')
      show('error', `Failed to clean ${project.name}: ${message}`)
    }
  }, [project, show, handleError])

  const togglePinProject = useCallback((projectName: string) => {
    const updatedProjects = projects.map((p) =>
      p.name === projectName ? { ...p, pinned: !p.pinned } : p
    )
    updatedProjects.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

    setProjects(updatedProjects)
    saveProjects(updatedProjects)
    const pinned = updatedProjects.find((p) => p.name === projectName)?.pinned
    show('success', `${projectName} ${pinned ? 'pinned' : 'unpinned'}.`)
  }, [projects, setProjects, saveProjects, show])

  const handleDeleteProject = useCallback(async (projectToDel: Project) => {
    const confirmed = confirm(`Delete ${projectToDel.name} permanently?`)
    if (!confirmed) return

    try {
      await tauriCommands.deleteProject(projectToDel.path)
      const updatedProjects = projects.filter((p) => p.name !== projectToDel.name)
      setProjects(updatedProjects)
      saveProjects(updatedProjects)
      show('success', `${projectToDel.name} deleted successfully.`)
    } catch (error) {
      const message = handleError(error, 'deleting project')
      show('error', `Error deleting ${projectToDel.name}: ${message}`)
    }
  }, [projects, setProjects, saveProjects, show, handleError])

  if (!project) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-center">
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <DropdownMenuLabel>Project actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleOpenInExplorer(project.path)}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Open in Explorer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenInVSCode(project.path)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in VS Code
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenTerminal(project.path)}>
          <Terminal className="mr-2 h-4 w-4" />
          Open Terminal
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => togglePinProject(project.name)}>
          <Pin className="mr-2 h-4 w-4" />
          {project.pinned ? 'Unpin project' : 'Pin project'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCleanProject(project.path)}>
          <Recycle className="mr-2 h-4 w-4" />
          Clean project
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => handleDeleteProject(project)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProjectActions
