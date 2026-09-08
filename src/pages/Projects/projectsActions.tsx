import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ExternalLink,
  FolderOpen,
  MoreHorizontal,
  Pin,
  Recycle,
  Terminal,
  Trash2,
  Loader2,
  Package,
} from 'lucide-react'
import { useAlertStore } from '@/store/alertStore'
import { tauriCommands, useTauriErrorHandler } from '@/lib/tauriUtils'
import { Project } from '@/types/project'
import { useProjectStore } from '@/store/projectStore'

const ProjectActions: React.FC = () => {
  const { show } = useAlertStore()
  const { handleError } = useTauriErrorHandler()
  const navigate = useNavigate()
  const { projects, saveProjects, setSelectedProject, selectedProject: project } = useProjectStore()
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const handleOpenInExplorer = useCallback(
    async (path: string) => {
      if (!project) return
      setBusyAction('explorer')
      try {
        await tauriCommands.openInExplorer(path)
        show('success', `Opened ${project.name} in Explorer.`)
      } catch (error) {
        const message = handleError(error, 'opening in Explorer')
        show('error', `Failed to open ${project.name} in Explorer: ${message}`)
      } finally {
        setBusyAction(null)
      }
    },
    [project, show, handleError]
  )

  const handleOpenInVSCode = useCallback(
    async (path: string) => {
      if (!project) return
      setBusyAction('vscode')
      try {
        await tauriCommands.openInVSCode(path)
        show('success', `Opened ${project.name} in VS Code.`)
      } catch (error) {
        const message = handleError(error, 'opening in VS Code')
        show('error', `Failed to open ${project.name} in VS Code: ${message}`)
      } finally {
        setBusyAction(null)
      }
    },
    [project, show, handleError]
  )

  const handleOpenTerminal = useCallback(
    async (path: string) => {
      if (!project) return
      setBusyAction('terminal')
      try {
        await tauriCommands.openTerminal(path)
        show('success', `Opened terminal in ${project.name}.`)
      } catch (error) {
        const message = handleError(error, 'opening terminal')
        show('error', `Failed to open terminal for ${project.name}: ${message}`)
      } finally {
        setBusyAction(null)
      }
    },
    [project, show, handleError]
  )

  const handleCleanProject = useCallback(
    async (path: string) => {
      if (!project) return
      try {
        const confirmed = confirm(
          `Clean ${project.name}? This removes node_modules, build output, and temporary files.`
        )
        if (!confirmed) return

        setBusyAction('clean')
        await tauriCommands.cleanProject(path)
        show('success', `${project.name} has been cleaned.`)
      } catch (error) {
        const message = handleError(error, 'cleaning project')
        show('error', `Failed to clean ${project.name}: ${message}`)
      } finally {
        setBusyAction(null)
      }
    },
    [project, show, handleError]
  )

  const togglePinProject = useCallback(
    async (projectName: string) => {
      setBusyAction('pin')
      const updatedProjects = projects.map((p) =>
        p.name === projectName ? { ...p, pinned: !p.pinned } : p
      )
      updatedProjects.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

      try {
        await saveProjects(updatedProjects)
        const pinned = updatedProjects.find((p) => p.name === projectName)?.pinned
        show('success', `${projectName} ${pinned ? 'pinned' : 'unpinned'}.`)
      } catch (error) {
        const message = handleError(error, 'saving project changes')
        show('error', `Failed to update ${projectName}: ${message}`)
      } finally {
        setBusyAction(null)
      }
    },
    [projects, saveProjects, show, handleError]
  )

  const handleDeleteProject = useCallback(
    async (projectToDel: Project) => {
      const confirmed = confirm(`Delete ${projectToDel.name} permanently?`)
      if (!confirmed) return

      setBusyAction('delete')
      try {
        await tauriCommands.deleteProject(projectToDel.path)
        const updatedProjects = projects.filter((p) => p.name !== projectToDel.name)
        await saveProjects(updatedProjects)
        setSelectedProject(null)
        show('success', `${projectToDel.name} deleted successfully.`)
      } catch (error) {
        const message = handleError(error, 'deleting project')
        show('error', `Error deleting ${projectToDel.name}: ${message}`)
      } finally {
        setBusyAction(null)
      }
    },
    [projects, saveProjects, setSelectedProject, show, handleError]
  )

  if (!project) return null

  const isBusy = Boolean(busyAction)
  const actionIcon = (action: string, icon: React.ReactNode) =>
    busyAction === action ? <Loader2 className="h-4 w-4 animate-spin" /> : icon

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="outline"
          size="icon"
          title="Open in Explorer"
          aria-label="Open in Explorer"
          disabled={isBusy}
          onClick={() => handleOpenInExplorer(project.path)}
        >
          {actionIcon('explorer', <FolderOpen className="h-4 w-4" />)}
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Manage npm packages"
          aria-label="Manage npm packages"
          disabled={isBusy}
          onClick={() => navigate('/packages')}
        >
          <Package className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Open in VS Code"
          aria-label="Open in VS Code"
          disabled={isBusy}
          onClick={() => handleOpenInVSCode(project.path)}
        >
          {actionIcon('vscode', <ExternalLink className="h-4 w-4" />)}
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Open terminal"
          aria-label="Open terminal"
          disabled={isBusy}
          onClick={() => handleOpenTerminal(project.path)}
        >
          {actionIcon('terminal', <Terminal className="h-4 w-4" />)}
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-muted-foreground"
            disabled={isBusy}
          >
            <span>{isBusy ? 'Working...' : 'More actions'}</span>
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Workspace actions</DropdownMenuLabel>
          <DropdownMenuItem disabled={isBusy} onClick={() => togglePinProject(project.name)}>
            <Pin className="mr-2 h-4 w-4" />
            {project.pinned ? 'Unpin project' : 'Pin project'}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isBusy} onClick={() => handleCleanProject(project.path)}>
            <Recycle className="mr-2 h-4 w-4" />
            Clean project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isBusy}
            variant="destructive"
            onClick={() => handleDeleteProject(project)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default ProjectActions
