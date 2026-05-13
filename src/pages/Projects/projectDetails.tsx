import * as React from 'react'
import { invoke } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { Clipboard, Layers, CalendarDays, Clock, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/projectStore'

const ProjectDetails: React.FC = () => {
  const { selectedProject } = useProjectStore()
  const [lastModified, setLastModified] = React.useState<Date | null>(null)
  const [folderSize, setFolderSize] = React.useState<string>('Calculating...')
  const [shortenedPath, setShortenedPath] = React.useState<string>('')

  const getLastModifiedDate = React.useCallback(async (dirPath: string) => {
    try {
      const timestamp = await invoke<number>('get_last_modified', { dirPath })
      return timestamp ? new Date(timestamp * 1000) : null
    } catch (error) {
      console.error('Error fetching last modified date:', error)
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
      return 'Error calculating size'
    }
  }, [])

  React.useEffect(() => {
    if (selectedProject) {
      getLastModifiedDate(selectedProject.path).then(setLastModified)
      getFolderSize(selectedProject.path).then(setFolderSize)

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
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/70 bg-muted/50 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Project summary
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">{selectedProject.name}</h2>
            <Badge className="mt-3 rounded-full px-3 py-1 text-xs uppercase tracking-[0.17em]">
              {selectedProject.type}
            </Badge>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => copyPathClipboard(selectedProject.path)}
          >
            <Clipboard className="mr-2 h-4 w-4" />
            Copy path
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span>Project location</span>
            </div>
            <p className="mt-3 text-sm leading-6 break-words text-foreground">{shortenedPath}</p>
          </div>
          <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>Size</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">{folderSize}</p>
          </div>
          <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>Created</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {new Date(selectedProject.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last modified</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {lastModified ? lastModified.toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        {projectAge !== null && (
          <div className="rounded-3xl border border-border/60 bg-background/80 p-4 text-sm text-muted-foreground">
            Project age: <span className="text-foreground font-semibold">{projectAge} days</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectDetails
