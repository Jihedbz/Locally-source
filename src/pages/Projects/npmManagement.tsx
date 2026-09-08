import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { listen } from '@tauri-apps/api/event'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Download,
  ExternalLink,
  FileQuestion,
  Loader2,
  Package,
  RefreshCw,
  Search,
  StopCircle,
  Terminal,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAlertStore } from '@/store/alertStore'
import { useProjectStore } from '@/store/projectStore'
import {
  NpmAvailability,
  NpmPackage,
  NpmPackageMetadata,
  NpmProgressPayload,
  NpmSearchResult,
  tauriCommands,
} from '@/lib/tauriUtils'

interface ActiveInstallState {
  id: string
  action: string
  title: string
  logs: string[]
}

const NpmManagement = () => {
  const project = useProjectStore((state) => state.selectedProject)
  const { show } = useAlertStore()

  const [availability, setAvailability] = useState<NpmAvailability | null>(null)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

  const [packages, setPackages] = useState<NpmPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<NpmPackage | null>(null)
  const [metadata, setMetadata] = useState<NpmPackageMetadata | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NpmSearchResult[]>([])
  const [version, setVersion] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [busyPackage, setBusyPackage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [installAsDev, setInstallAsDev] = useState(false)

  const [isMissingPackageJson, setIsMissingPackageJson] = useState(false)
  const [isInitializingJson, setIsInitializingJson] = useState(false)

  const [activeInstall, setActiveInstall] = useState<ActiveInstallState | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const checkAvailability = useCallback(async () => {
    setIsCheckingAvailability(true)
    try {
      const status = await tauriCommands.checkNpmAvailability()
      setAvailability(status)
    } catch (err) {
      setAvailability({
        installed: false,
        online: false,
        message: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsCheckingAvailability(false)
    }
  }, [])

  const loadPackages = useCallback(async () => {
    if (!project) return
    setIsLoading(true)
    setError(null)
    setIsMissingPackageJson(false)
    try {
      setPackages(await tauriCommands.getNpmPackages(project.path))
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : String(loadError)
      if (
        message.toLowerCase().includes('package.json') ||
        message.includes('FILE_NOT_FOUND') ||
        message.includes('No such file')
      ) {
        setIsMissingPackageJson(true)
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [project])

  useEffect(() => {
    checkAvailability()
  }, [checkAvailability])

  useEffect(() => {
    setSelectedPackage(null)
    setMetadata(null)
    loadPackages()
  }, [loadPackages])

  useEffect(() => {
    if (!selectedPackage) {
      setMetadata(null)
      return
    }

    setVersion(selectedPackage.version)
    setIsLoadingMetadata(true)
    tauriCommands
      .getNpmPackageMetadata(selectedPackage.name, selectedPackage.version)
      .then(setMetadata)
      .catch(() => setMetadata(null))
      .finally(() => setIsLoadingMetadata(false))
  }, [selectedPackage])

  useEffect(() => {
    let unlisten: (() => void) | undefined
    const setupListener = async () => {
      try {
        unlisten = await listen<NpmProgressPayload>('npm-install-progress', (event) => {
          const payload = event.payload
          setActiveInstall((prev) => {
            if (!prev || prev.id !== payload.installId) return prev
            return {
              ...prev,
              logs: [...prev.logs, payload.line],
            }
          })
        })
      } catch {
        // Fallback for non-Tauri / test environments
      }
    }
    setupListener()
    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  useEffect(() => {
    if (activeInstall?.logs.length) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeInstall?.logs])

  const handleInitPackageJson = async () => {
    if (!project) return
    setIsInitializingJson(true)
    try {
      await tauriCommands.initPackageJson(project.path)
      show('success', 'package.json initialized successfully!')
      await loadPackages()
    } catch (err) {
      show('error', err instanceof Error ? err.message : String(err))
    } finally {
      setIsInitializingJson(false)
    }
  }

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault()
    if (!searchQuery.trim()) return

    if (availability && !availability.online) {
      show('error', 'Cannot search npm registry while offline.')
      return
    }

    setIsSearching(true)
    try {
      setSearchResults(await tauriCommands.searchNpmPackages(searchQuery.trim()))
    } catch (searchError) {
      show('error', searchError instanceof Error ? searchError.message : String(searchError))
    } finally {
      setIsSearching(false)
    }
  }

  const refreshPackages = async () => {
    await checkAvailability()
    await loadPackages()
    show('success', 'Installed packages and status refreshed.')
  }

  const runPackageAction = async (
    packageName: string,
    action: (installId: string) => Promise<string>,
    successMessage: string,
    title: string
  ) => {
    const installId = `install-${Date.now()}`
    setBusyPackage(packageName)
    setActiveInstall({
      id: installId,
      action: packageName,
      title,
      logs: [],
    })

    try {
      await action(installId)
      await loadPackages()
      show('success', successMessage)
    } catch (actionError) {
      show('error', actionError instanceof Error ? actionError.message : String(actionError))
    } finally {
      setBusyPackage(null)
      setActiveInstall(null)
    }
  }

  const installPackage = (result: NpmSearchResult) => {
    if (!project) return
    return runPackageAction(
      result.name,
      (installId) =>
        tauriCommands.installNpmPackage({
          path: project.path,
          package: result.name,
          version: result.version,
          dev: installAsDev,
          installId,
        }),
      `${result.name} installed successfully.`,
      `Installing ${result.name}@${result.version}`
    )
  }

  const installVersion = () => {
    if (!project || !selectedPackage || !version.trim()) return
    return runPackageAction(
      selectedPackage.name,
      (installId) =>
        tauriCommands.installNpmPackage({
          path: project.path,
          package: selectedPackage.name,
          version: version.trim(),
          dev: selectedPackage.dependencyType === 'development',
          installId,
        }),
      `${selectedPackage.name} updated to ${version.trim()}.`,
      `Installing ${selectedPackage.name}@${version.trim()}`
    )
  }

  const handleCancelInstall = async () => {
    if (!activeInstall) return
    try {
      await tauriCommands.cancelNpmInstall(activeInstall.id)
      show('success', 'Cancellation request sent.')
    } catch (err) {
      show('error', err instanceof Error ? err.message : String(err))
    }
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">No project selected</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a project before opening package management.
          </p>
          <Button asChild className="mt-6">
            <Link to="/projects">Back to projects</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isNpmMissing = availability?.installed === false

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
            <Link to="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to projects
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Package management
            </p>
            {availability && (
              <div className="flex items-center gap-2">
                {availability.installed ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle className="h-3 w-3" />
                    npm {availability.version || 'installed'}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    npm missing
                  </Badge>
                )}
                {availability.installed &&
                  (availability.online ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 text-emerald-600 dark:text-emerald-400"
                    >
                      <Wifi className="h-3 w-3" />
                      Registry Online
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400"
                    >
                      <WifiOff className="h-3 w-3" />
                      Registry Offline
                    </Badge>
                  ))}
              </div>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inspect and maintain this project's npm dependencies.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshPackages}
          disabled={isLoading || isCheckingAvailability}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading || isCheckingAvailability ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </header>

      {isNpmMissing && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">npm command not found</p>
            <p className="text-xs opacity-90">
              {availability?.message ||
                'npm is not installed or not available in PATH. Please install Node.js and npm to manage packages.'}
            </p>
          </div>
        </div>
      )}

      {availability?.installed && !availability.online && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
          <WifiOff className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">npm registry unreachable</p>
            <p className="text-xs opacity-90">
              Your network or registry is offline. Searching or downloading new packages may fail.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Could not load packages: {error}</span>
          <Button variant="outline" size="sm" onClick={loadPackages}>
            Try again
          </Button>
        </div>
      )}

      {/* Real-time Install Progress Modal */}
      {activeInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <h3 className="font-semibold">{activeInstall.title}</h3>
              </div>
              <Button variant="destructive" size="sm" onClick={handleCancelInstall}>
                <StopCircle className="mr-2 h-4 w-4" />
                Cancel Install
              </Button>
            </div>
            <div className="h-64 overflow-y-auto rounded-xl border border-border/80 bg-zinc-950 p-4 font-mono text-xs text-zinc-200">
              {activeInstall.logs.length === 0 ? (
                <p className="text-zinc-500 italic">Starting command execution...</p>
              ) : (
                activeInstall.logs.map((logLine, idx) => (
                  <div key={idx} className="whitespace-pre-wrap break-all leading-5">
                    {logLine}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-border/70 bg-background/80 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold">Add a package</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search the npm registry and install a package into this project.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={installAsDev}
              onChange={(event) => setInstallAsDev(event.target.checked)}
              disabled={isNpmMissing}
            />
            Save as dev dependency
          </label>
        </div>
        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search npm packages"
            aria-label="Search npm packages"
            disabled={isNpmMissing}
          />
          <Button type="submit" disabled={isSearching || isNpmMissing}>
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </form>
        {searchResults.length > 0 && (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {searchResults.map((result) => (
              <div
                key={`${result.name}-${result.version}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{result.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {result.version} {result.description ? `- ${result.description}` : ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={Boolean(busyPackage) || isNpmMissing}
                  onClick={() => installPackage(result)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Install
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Installed packages</h2>
              <p className="text-sm text-muted-foreground">
                {isMissingPackageJson
                  ? 'package.json missing'
                  : `${packages.length} dependencies in package.json`}
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl border border-border/60 bg-muted/40"
                />
              ))}
            </div>
          ) : isMissingPackageJson ? (
            <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-center space-y-3">
              <FileQuestion className="mx-auto h-8 w-8 text-amber-500" />
              <h3 className="text-base font-semibold">No package.json found</h3>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                This project directory does not contain a{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">package.json</code> file.
                Initialize it to enable dependency management.
              </p>
              <Button
                onClick={handleInitPackageJson}
                disabled={isInitializingJson || isNpmMissing}
                className="mt-2"
              >
                {isInitializingJson ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Terminal className="mr-2 h-4 w-4" />
                )}
                {isInitializingJson ? 'Initializing...' : 'Initialize package.json'}
              </Button>
            </div>
          ) : packages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
              <Package className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 font-medium">No npm packages found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use the search above to add your first dependency.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {packages.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => setSelectedPackage(item)}
                  className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 ${selectedPackage?.name === item.name ? 'border-primary bg-muted/50' : 'border-border/70'}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.name}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {item.version}
                    </span>
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {item.dependencyType === 'development' ? 'dev' : 'prod'}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="self-start rounded-2xl border border-border/70 bg-background/80 p-5 lg:sticky lg:top-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Package details
          </p>
          {selectedPackage ? (
            <div className="mt-4 space-y-5">
              <div>
                <h2 className="break-all text-xl font-semibold">
                  {metadata?.name || selectedPackage.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isLoadingMetadata
                    ? 'Loading metadata...'
                    : metadata?.description || 'No description available.'}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Installed</dt>
                  <dd className="mt-1 font-medium">{selectedPackage.version}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="mt-1 font-medium capitalize">{selectedPackage.dependencyType}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">License</dt>
                  <dd className="mt-1 font-medium">{metadata?.license || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Latest checked</dt>
                  <dd className="mt-1 font-medium">{metadata?.version || 'Unknown'}</dd>
                </div>
              </dl>
              {metadata?.homepage && (
                <a
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                  href={metadata.homepage}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Package homepage
                </a>
              )}
              <div className="space-y-2 border-t border-border/70 pt-4">
                <Label htmlFor="package-version">Install a specific version</Label>
                <div className="flex gap-2">
                  <Input
                    id="package-version"
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                    placeholder="e.g. 1.2.3"
                    disabled={isNpmMissing}
                  />
                  <Button
                    size="icon"
                    title="Install version"
                    aria-label="Install version"
                    disabled={busyPackage === selectedPackage.name || isNpmMissing}
                    onClick={installVersion}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={Boolean(busyPackage) || isNpmMissing}
                  onClick={() =>
                    runPackageAction(
                      selectedPackage.name,
                      (installId) =>
                        tauriCommands.updateNpmPackage(
                          project.path,
                          selectedPackage.name,
                          installId
                        ),
                      `${selectedPackage.name} updated.`,
                      `Updating ${selectedPackage.name}`
                    )
                  }
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  title="Remove package"
                  aria-label="Remove package"
                  disabled={Boolean(busyPackage) || isNpmMissing}
                  onClick={() => {
                    if (confirm(`Remove ${selectedPackage.name}?`))
                      runPackageAction(
                        selectedPackage.name,
                        (installId) =>
                          tauriCommands.removeNpmPackage(
                            project.path,
                            selectedPackage.name,
                            installId
                          ),
                        `${selectedPackage.name} removed.`,
                        `Removing ${selectedPackage.name}`
                      )
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Select an installed package to inspect metadata or change its version.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

export default NpmManagement
