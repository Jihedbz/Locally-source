import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, FolderSearch, FolderPlus, CheckCircle2 } from 'lucide-react'
import { useAlertStore } from '@/store/alertStore'
import { useProjectStore } from '@/store/projectStore'
import { tauriCommands } from '@/lib/tauriUtils'
import { DiscoveredProject, Project } from '@/types/project'
import { getProjectIcon } from '@/lib/projectUtils'

interface ImportProjectsDialogProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ImportProjectsDialog({
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: ImportProjectsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const isOpen = isControlled ? externalOpen : internalOpen
  const setIsOpen = (val: boolean) => {
    if (externalOnOpenChange) externalOnOpenChange(val)
    if (!isControlled) setInternalOpen(val)
  }

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [discoveredProjects, setDiscoveredProjects] = useState<DiscoveredProject[]>([])
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [isScanning, setIsScanning] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const { show } = useAlertStore()
  const { projects, addProject } = useProjectStore()

  const existingPaths = new Set(projects.map((p) => p.path.toLowerCase().replace(/\\/g, '/')))

  const handlePickFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select a project or workspace directory',
      })

      if (!selected || typeof selected !== 'string') return

      const normalizedPath = selected.replace(/\\/g, '/')
      setSelectedFolder(normalizedPath)
      setIsScanning(true)
      setDiscoveredProjects([])
      setSelectedPaths(new Set())

      const results = await tauriCommands.scanDirectoryForProjects(normalizedPath)
      setDiscoveredProjects(results)

      // Auto-select valid projects that are not already imported
      const initialSelected = new Set<string>()
      results.forEach((p) => {
        const pNorm = p.path.toLowerCase()
        if (!existingPaths.has(pNorm)) {
          initialSelected.add(p.path)
        }
      })
      setSelectedPaths(initialSelected)
    } catch (error) {
      show('error', error instanceof Error ? error.message : String(error))
    } finally {
      setIsScanning(false)
    }
  }

  const handleToggleSelect = (path: string) => {
    const next = new Set(selectedPaths)
    if (next.has(path)) {
      next.delete(path)
    } else {
      next.add(path)
    }
    setSelectedPaths(next)
  }

  const handleToggleAll = () => {
    const importable = discoveredProjects.filter(
      (p) => !existingPaths.has(p.path.toLowerCase().replace(/\\/g, '/'))
    )
    if (selectedPaths.size === importable.length) {
      setSelectedPaths(new Set())
    } else {
      setSelectedPaths(new Set(importable.map((p) => p.path)))
    }
  }

  const handleConfirmImport = async () => {
    const toImport = discoveredProjects.filter((p) => selectedPaths.has(p.path))
    if (toImport.length === 0) {
      show('error', 'Please select at least one project to import.')
      return
    }

    setIsImporting(true)
    let importedCount = 0
    let skippedCount = 0

    try {
      for (const disc of toImport) {
        const newProj: Project = {
          name: disc.name,
          path: disc.path,
          type: disc.type,
          createdAt: disc.createdAt
            ? new Date(Number(disc.createdAt) || disc.createdAt).toISOString()
            : new Date().toISOString(),
          pinned: false,
        }
        try {
          await addProject(newProj)
          importedCount++
        } catch {
          skippedCount++
        }
      }

      if (importedCount > 0) {
        show(
          'success',
          `Successfully imported ${importedCount} project${importedCount > 1 ? 's' : ''}!${
            skippedCount > 0 ? ` (${skippedCount} skipped due to duplicates)` : ''
          }`
        )
      } else {
        show('error', 'Selected projects were already in your library.')
      }

      setIsOpen(false)
      setSelectedFolder(null)
      setDiscoveredProjects([])
      setSelectedPaths(new Set())
    } catch (error) {
      show('error', error instanceof Error ? error.message : String(error))
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FolderSearch className="h-5 w-5 text-primary" />
            Import existing projects
          </DialogTitle>
          <DialogDescription>
            Select a project folder or a workspace directory to scan and add existing codebases to
            Locally.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePickFolder}
              disabled={isScanning || isImporting}
              className="gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              Choose directory
            </Button>
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {selectedFolder || 'No directory selected yet'}
            </span>
          </div>

          {isScanning && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Scanning directory for projects...
            </div>
          )}

          {!isScanning && selectedFolder && discoveredProjects.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
              No projects found in the selected folder.
            </div>
          )}

          {!isScanning && discoveredProjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Discovered ({discoveredProjects.length})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleAll}
                  className="h-7 text-xs"
                >
                  {selectedPaths.size ===
                  discoveredProjects.filter(
                    (p) => !existingPaths.has(p.path.toLowerCase().replace(/\\/g, '/'))
                  ).length
                    ? 'Deselect all'
                    : 'Select all importable'}
                </Button>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {discoveredProjects.map((proj) => {
                  const normPath = proj.path.toLowerCase().replace(/\\/g, '/')
                  const isAlreadyAdded = existingPaths.has(normPath)
                  const isChecked = selectedPaths.has(proj.path)

                  return (
                    <div
                      key={proj.path}
                      onClick={() => !isAlreadyAdded && handleToggleSelect(proj.path)}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                        isAlreadyAdded
                          ? 'border-border/40 bg-muted/30 opacity-60'
                          : isChecked
                            ? 'border-primary/50 bg-primary/5 cursor-pointer'
                            : 'border-border/60 hover:bg-muted/40 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={isChecked}
                          disabled={isAlreadyAdded}
                          onCheckedChange={() => handleToggleSelect(proj.path)}
                        />
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          {getProjectIcon(proj.type, 'text-lg')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{proj.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{proj.path}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="capitalize text-xs">
                          {proj.type}
                        </Badge>
                        {isAlreadyAdded && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> In library
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmImport}
            disabled={isScanning || isImporting || selectedPaths.size === 0}
            className="gap-2"
          >
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Import selected ({selectedPaths.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportProjectsDialog
