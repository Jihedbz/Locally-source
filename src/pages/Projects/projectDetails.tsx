import * as React from 'react'
import { invoke } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { CalendarDays, Clipboard, Clock, Database, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/projectStore'
import { getProjectIcon } from '@/lib/projectUtils'

const ProjectDetails: React.FC = () => {
  const { selectedProject } = useProjectStore()
  const [lastModified, setLastModified] = React.useState<Date | null>(null)
  const [folderSize, setFolderSize] = React.useState<string>('Calculating...')
  const [shortenedPath, setShortenedPath] = React.useState<string>('')
  const [isLoadingMetadata, setIsLoadingMetadata] = React.useState(false)
  const [metadataError, setMetadataError] = React.useState<string | null>(null)

  const getLastModifiedDate = React.useCallback(async (dirPath: string) => {
    try {
      const timestamp = await invoke<number>('get_last_modified', { dirPath })
      return timestamp ? new Date(timestamp * 1000) : null
    } catch (error) {
      console.error('Error fetching last modified date:', error)
      setMetadataError('Metadata unavailable')
      return null
    }
  }, [])

  const copyPathClipboard = React.useCallback(async (path: string) => {
    try {
      await writeText(path)
      console.log('Path copied to clipboard:', path)
    } catch (error) {
      console.error('Error copying path to clipboard:', error)
    }
  }, [])

  const getFolderSize = React.useCallback(async (path: string): Promise<string> => {
    try {
      const size = await invoke<number>('get_dir_size', { path })
      return size ? `${(size / (1024 * 1024)).toFixed(2)} MB` : '0 MB'
    } catch (error) {
      console.error('Error calculating folder size:', error)
      setMetadataError('Metadata unavailable')
      return 'Unavailable'
    }
  }, [])

  React.useEffect(() => {
    if (selectedProject) {
      setIsLoadingMetadata(true)
      setMetadataError(null)
      getLastModifiedDate(selectedProject.path).then(setLastModified)
      getFolderSize(selectedProject.path)
        .then(setFolderSize)
        .finally(() => setIsLoadingMetadata(false))

      const shortenPath = async (fullPath: string) => {
        try {
          const appDataDirPath = await appDataDir()
          const projectsDirPath = await join(appDataDirPath, 'projects')
          const normalizedFullPath = fullPath.replace(/\\/g, '/')
          const normalizedProjectsDirPath = projectsDirPath.replace(/\\/g, '/')

          if (normalizedFullPath.startsWith(normalizedProjectsDirPath)) {
            const relativePath = normalizedFullPath.substring(normalizedProjectsDirPath.length)
            setShortenedPath(`/projects${relativePath}`)
          } else {
            setShortenedPath(fullPath)
          }
        } catch (error) {
          console.error('Error shortening path:', error)
          setShortenedPath(fullPath)
        }
      }

      shortenPath(selectedProject.path)
    } else {
      setShortenedPath('')
      setMetadataError(null)
    }
  }, [selectedProject, getLastModifiedDate, getFolderSize])

  if (!selectedProject) return null

  const projectAge = selectedProject.createdAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(selectedProject.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : null

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60">
          {getProjectIcon(selectedProject.type)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-foreground">{selectedProject.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-md px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]"
            >
              {selectedProject.type}
            </Badge>
            {selectedProject.pinned && (
              <span className="text-xs text-muted-foreground">Pinned</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-y border-border/70 py-4">
        <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" /> Location
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Copy project path"
            aria-label="Copy project path"
            onClick={() => copyPathClipboard(selectedProject.path)}
          >
            <Clipboard className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="mt-2 break-words text-sm leading-6 text-foreground">
          {shortenedPath || 'Loading path...'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <Database className="h-3.5 w-3.5" /> Size
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {isLoadingMetadata ? 'Calculating...' : folderSize}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> Created
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {new Date(selectedProject.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="col-span-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Last modified
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {metadataError ||
              (lastModified
                ? lastModified.toLocaleString()
                : isLoadingMetadata
                  ? 'Loading...'
                  : 'Unavailable')}
          </p>
        </div>
      </div>

      {projectAge !== null && (
        <p className="border-t border-border/70 pt-4 text-sm text-muted-foreground">
          Project age <span className="font-semibold text-foreground">{projectAge} days</span>
        </p>
      )}
    </div>
  )
}

export default ProjectDetails
