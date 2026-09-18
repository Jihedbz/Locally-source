import React, { useCallback, useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
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
  Play,
  Square,
} from 'lucide-react'
import { useAlertStore } from '@/store/alertStore'
import {
  DevServerOutputPayload,
  NpmProgressPayload,
  tauriCommands,
  useTauriErrorHandler,
} from '@/lib/tauriUtils'
import { Project } from '@/types/project'
import { useProjectStore } from '@/store/projectStore'
import { useSettingsStore } from '@/store/settingsStore'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type Confirmation =
  | { action: 'clean'; path: string; projectName: string }
  | { action: 'delete'; project: Project }

const ProjectActions: React.FC = () => {
  const { show } = useAlertStore()
  const { handleError } = useTauriErrorHandler()
  const navigate = useNavigate()
  const { projects, saveProjects, setSelectedProject, selectedProject: project } = useProjectStore()
  const { preferredEditor, customEditorPath, preferredTerminal, customTerminalPath } =
    useSettingsStore()
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [devSessionId, setDevSessionId] = useState<string | null>(null)
  const devSessionIdRef = useRef<string | null>(null)
  const [devLogs, setDevLogs] = useState<string[]>([])
  const [devStatus, setDevStatus] = useState<'stopped' | 'running' | 'error'>('stopped')

  useEffect(() => {
    let unlistenDev: (() => void) | undefined
    let unlistenNpm: (() => void) | undefined
    const setup = async () => {
      try {
        unlistenDev = await listen<DevServerOutputPayload>('dev-server-output', (event) => {
          const payload = event.payload
          if (!devSessionIdRef.current || payload.sessionId !== devSessionIdRef.current) return
          setDevLogs((logs) => [...logs, payload.line])
          if (payload.status === 'stopped') {
            setDevStatus('stopped')
            devSessionIdRef.current = null
            setDevSessionId(null)
          }
        })
        unlistenNpm = await listen<NpmProgressPayload>('npm-install-progress', (event) => {
          const payload = event.payload
          if (!devSessionIdRef.current || payload.installId !== devSessionIdRef.current) return
          setDevLogs((logs) => [...logs, payload.line])
        })
      } catch {
        // Fallback for non-Tauri environments.
      }
    }
    setup()
    return () => {
      if (unlistenDev) unlistenDev()
      if (unlistenNpm) unlistenNpm()
    }
  }, [])

  useEffect(() => {
    devSessionIdRef.current = devSessionId
  }, [devSessionId])

  const startDevServer = useCallback(async () => {
    if (!project) return
    const sessionId = `dev-${Date.now()}`
    devSessionIdRef.current = sessionId
    setDevSessionId(sessionId)
    setDevLogs([])
    setDevStatus('running')
    try {
      await tauriCommands.startDevServer(project.path, sessionId)
    } catch (error) {
      setDevStatus('error')
      setDevLogs((logs) => [...logs, error instanceof Error ? error.message : String(error)])
    }
  }, [project])

  const stopDevServer = useCallback(async () => {
    if (!devSessionId) return
    try {
      await tauriCommands.stopDevServer(devSessionId)
      devSessionIdRef.current = null
      setDevSessionId(null)
      setDevStatus('stopped')
    } catch (error) {
      show('error', error instanceof Error ? error.message : String(error))
    }
  }, [devSessionId, show])

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
        await tauriCommands.openInVSCode(path, preferredEditor, customEditorPath)
        const editorLabel =
          preferredEditor === 'cursor'
            ? 'Cursor'
            : preferredEditor === 'webstorm'
              ? 'WebStorm'
              : preferredEditor === 'custom'
                ? 'custom editor'
                : 'VS Code'
        show('success', `Opened ${project.name} in ${editorLabel}.`)
      } catch (error) {
        const message = handleError(error, 'opening in editor')
        show('error', `Failed to open ${project.name} in editor: ${message}`)
      } finally {
        setBusyAction(null)
      }
    },
    [project, preferredEditor, customEditorPath, show, handleError]
  )

  const handleOpenTerminal = useCallback(
    async (path: string) => {
      if (!project) return
      setBusyAction('terminal')
      try {
        await tauriCommands.openTerminal(path, preferredTerminal, customTerminalPath)
        show('success', `Opened terminal in ${project.name}.`)
      } catch (error) {
        const message = handleError(error, 'opening terminal')
        show('error', `Failed to open terminal for ${project.name}: ${message}`)
      } finally {
        setBusyAction(null)
      }
    },
    [project, preferredTerminal, customTerminalPath, show, handleError]
  )

  const handleCleanProject = useCallback(
    async (path: string) => {
      if (!project) return
      setConfirmation({ action: 'clean', path, projectName: project.name })
    },
    [project]
  )

  const confirmCleanProject = useCallback(async () => {
    if (!confirmation || confirmation.action !== 'clean') return
    setBusyAction('clean')
    try {
      await tauriCommands.cleanProject(confirmation.path)
      show('success', `${confirmation.projectName} has been cleaned.`)
      setConfirmation(null)
    } catch (error) {
      const message = handleError(error, 'cleaning project')
      show('error', `Failed to clean ${confirmation.projectName}: ${message}`)
    } finally {
      setBusyAction(null)
    }
  }, [confirmation, show, handleError])

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

  const handleDeleteProject = useCallback(async (projectToDel: Project) => {
    setConfirmation({ action: 'delete', project: projectToDel })
  }, [])

  const confirmDeleteProject = useCallback(async () => {
    if (!confirmation || confirmation.action !== 'delete') return
    const projectToDel = confirmation.project
    setBusyAction('delete')
    try {
      try {
        await tauriCommands.deleteProject(projectToDel.path)
        show('success', `${projectToDel.name} deleted permanently from disk.`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        if (
          msg.includes('Remove from workspace library instead') ||
          msg.includes('Permission denied')
        ) {
          show('success', `Removed ${projectToDel.name} from workspace library.`)
        } else {
          throw error
        }
      }

      const updatedProjects = projects.filter((p) => p.name !== projectToDel.name)
      await saveProjects(updatedProjects)
      setSelectedProject(null)
      setConfirmation(null)
    } catch (error) {
      const message = handleError(error, 'deleting project')
      show('error', `Error removing ${projectToDel.name}: ${message}`)
    } finally {
      setBusyAction(null)
    }
  }, [confirmation, projects, saveProjects, setSelectedProject, show, handleError])

  if (!project) return null

  const isBusy = Boolean(busyAction)
  const actionIcon = (action: string, icon: React.ReactNode) =>
    busyAction === action ? <Loader2 className="h-4 w-4 animate-spin" /> : icon

  const editorTitle =
    preferredEditor === 'cursor'
      ? 'Open in Cursor'
      : preferredEditor === 'webstorm'
        ? 'Open in WebStorm'
        : preferredEditor === 'custom'
          ? 'Open in custom editor'
          : 'Open in VS Code'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        <Button
          variant={devStatus === 'running' ? 'destructive' : 'outline'}
          size="icon"
          title={devStatus === 'running' ? 'Stop dev server' : 'Run dev server'}
          aria-label={devStatus === 'running' ? 'Stop dev server' : 'Run dev server'}
          disabled={isBusy}
          onClick={devStatus === 'running' ? stopDevServer : startDevServer}
        >
          {devStatus === 'running' ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
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
          title={editorTitle}
          aria-label={editorTitle}
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

      {devLogs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400">
            <span>npm run dev {devStatus === 'running' ? '· running' : '· stopped'}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setDevLogs([])}
            >
              Clear
            </Button>
          </div>
          <div className="max-h-56 overflow-y-auto p-3 font-mono text-[11px] leading-5 text-zinc-200">
            {devLogs.map((line, index) => (
              <div key={`${index}-${line}`} className="whitespace-pre-wrap break-all">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

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

      <ConfirmDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !busyAction) setConfirmation(null)
        }}
        title={confirmation?.action === 'delete' ? 'Delete project?' : 'Clean project?'}
        description={
          confirmation?.action === 'delete'
            ? `Delete ${confirmation.project.name} permanently? This removes the project from disk.`
            : `Clean ${confirmation?.projectName || 'this project'}? This removes node_modules, build output, and temporary files.`
        }
        confirmLabel={confirmation?.action === 'delete' ? 'Delete project' : 'Clean project'}
        onConfirm={confirmation?.action === 'delete' ? confirmDeleteProject : confirmCleanProject}
        isBusy={Boolean(busyAction)}
      />
    </div>
  )
}

export default ProjectActions
