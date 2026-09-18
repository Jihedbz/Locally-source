import * as React from 'react'
import { invoke } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import {
  CalendarDays,
  Check,
  Clipboard,
  Clock,
  Database,
  Download,
  GitBranch,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Tag,
  User,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/projectStore'
import { useAlertStore } from '@/store/alertStore'
import { getProjectIcon } from '@/lib/projectUtils'
import { GitStatusReport } from '@/types/project'
import { tauriCommands } from '@/lib/tauriUtils'

const formatRelativeTime = (timestamp?: number) => {
  if (!timestamp) return 'Unknown'
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const ProjectDetails: React.FC = () => {
  const { selectedProject } = useProjectStore()
  const { show } = useAlertStore()
  const updateProjectTags = useProjectStore((state) => state.updateProjectTags)
  const [lastModified, setLastModified] = React.useState<Date | null>(null)
  const [folderSize, setFolderSize] = React.useState<string>('Calculating...')
  const [shortenedPath, setShortenedPath] = React.useState<string>('')
  const [isLoadingMetadata, setIsLoadingMetadata] = React.useState(false)
  const [metadataError, setMetadataError] = React.useState<string | null>(null)
  const [draftTags, setDraftTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState('')
  const [isSavingTags, setIsSavingTags] = React.useState(false)

  const [gitStatus, setGitStatus] = React.useState<GitStatusReport | null>(null)
  const [isLoadingGit, setIsLoadingGit] = React.useState(false)
  const [gitAction, setGitAction] = React.useState<'fetch' | 'pull' | null>(null)

  React.useEffect(() => {
    setDraftTags(selectedProject?.tags || [])
    setTagInput('')
  }, [selectedProject])

  const fetchGitStatus = React.useCallback(async (path: string) => {
    setIsLoadingGit(true)
    try {
      const report = await tauriCommands.getGitStatus(path)
      setGitStatus(report)
    } catch (error) {
      console.error('Git status error:', error)
      setGitStatus(null)
    } finally {
      setIsLoadingGit(false)
    }
  }, [])

  const handleGitFetch = async () => {
    if (!selectedProject) return
    setGitAction('fetch')
    try {
      await tauriCommands.gitFetch(selectedProject.path)
      show('success', 'Git fetch completed.')
      await fetchGitStatus(selectedProject.path)
    } catch (error) {
      show('error', `Git fetch failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setGitAction(null)
    }
  }

  const handleGitPull = async () => {
    if (!selectedProject) return
    setGitAction('pull')
    try {
      await tauriCommands.gitPull(selectedProject.path)
      show('success', 'Git pull completed.')
      await fetchGitStatus(selectedProject.path)
    } catch (error) {
      show('error', `Git pull failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setGitAction(null)
    }
  }

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

      fetchGitStatus(selectedProject.path)

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
      setGitStatus(null)
    }
  }, [selectedProject, getLastModifiedDate, getFolderSize, fetchGitStatus])

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

      {/* Git Integration Section */}
      <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <GitBranch className="h-4 w-4 text-primary" />
            Git status
          </div>
          {gitStatus?.isRepo && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Fetch from remote"
                disabled={Boolean(gitAction) || isLoadingGit}
                onClick={handleGitFetch}
              >
                {gitAction === 'fetch' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Pull latest changes"
                disabled={Boolean(gitAction) || isLoadingGit}
                onClick={handleGitPull}
              >
                {gitAction === 'pull' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}
        </div>

        {isLoadingGit ? (
          <p className="text-xs text-muted-foreground">Checking repository status...</p>
        ) : !gitStatus?.isRepo ? (
          <p className="text-xs text-muted-foreground">Not a Git repository</p>
        ) : (
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                {gitStatus.branch || 'HEAD'}
              </span>
              <Badge
                variant={gitStatus.isClean ? 'outline' : 'secondary'}
                className="text-[10px] gap-1 px-2 py-0.5"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    gitStatus.isClean ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {gitStatus.isClean ? 'Clean' : 'Uncommitted'}
              </Badge>
            </div>

            {!gitStatus.isClean && (
              <div className="flex gap-2 text-[11px] text-muted-foreground">
                {gitStatus.modifiedCount > 0 && <span>{gitStatus.modifiedCount} modified</span>}
                {gitStatus.untrackedCount > 0 && <span>{gitStatus.untrackedCount} untracked</span>}
                {gitStatus.stagedCount > 0 && <span>{gitStatus.stagedCount} staged</span>}
              </div>
            )}

            {gitStatus.lastCommitMessage && (
              <div className="rounded-lg border border-border/50 bg-background/80 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 truncate font-medium text-foreground">
                    <User className="h-3 w-3 shrink-0" />
                    {gitStatus.lastCommitAuthor || 'Unknown'}
                  </span>
                  <span className="shrink-0">
                    {formatRelativeTime(gitStatus.lastCommitTimestamp)}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-foreground/90 font-mono leading-relaxed">
                  {gitStatus.lastCommitMessage}
                </p>
              </div>
            )}
          </div>
        )}
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

      <div className="space-y-3 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <Tag className="h-3.5 w-3.5" /> Tags
        </div>
        <div className="flex flex-wrap gap-2">
          {draftTags.length > 0 ? (
            draftTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag} tag`}
                  onClick={() => setDraftTags((current) => current.filter((item) => item !== tag))}
                  className="rounded-sm p-0.5 hover:bg-background/60"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No tags yet</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            aria-label="New project tag"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              const nextTag = tagInput.trim()
              if (
                nextTag &&
                !draftTags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())
              ) {
                setDraftTags((current) => [...current, nextTag])
                setTagInput('')
              }
            }}
            placeholder="Add a tag"
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Add project tag"
            title="Add project tag"
            onClick={() => {
              const nextTag = tagInput.trim()
              if (
                nextTag &&
                !draftTags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())
              ) {
                setDraftTags((current) => [...current, nextTag])
                setTagInput('')
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={isSavingTags}
          onClick={async () => {
            setIsSavingTags(true)
            try {
              await updateProjectTags(selectedProject.name, draftTags)
            } finally {
              setIsSavingTags(false)
            }
          }}
        >
          <Check className="mr-2 h-4 w-4" />
          {isSavingTags ? 'Saving tags...' : 'Save tags'}
        </Button>
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
