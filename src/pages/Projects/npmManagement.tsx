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
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  Shield,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAlertStore } from '@/store/alertStore'
import { useProjectStore } from '@/store/projectStore'
import { NpmAuditPanel } from './npmAuditPanel'
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
  const [activeTab, setActiveTab] = useState<'packages' | 'security'>('packages')

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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'packages' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('packages')}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          Packages
          {packages.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {packages.length}
            </Badge>
          )}
        </Button>

        <Button
          variant={activeTab === 'security' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('security')}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Security & Audit
        </Button>
      </div>

      {activeTab === 'security' ? (
        <NpmAuditPanel
          projectPath={project.path}
          projectName={project.name}
          onFixStart={(installId, actionTitle) => {
            setActiveInstall({
              id: installId,
              action: 'audit-fix',
              title: actionTitle,
              logs: [],
            })
          }}
          onFixEnd={() => {
            setActiveInstall(null)
          }}
          activeInstallId={activeInstall?.id}
          isOffline={availability?.installed === true && !availability.online}
        />
      ) : (
        <>
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
                  onChange={(e) => setInstallAsDev(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Install as devDependency
              </label>
            </div>

            <form onSubmit={handleSearch} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search npm packages (e.g., lodash, tailwindcss)..."
                  className="pl-9 pr-9"
                  disabled={
                    Boolean(busyPackage) ||
                    (availability?.installed === true && !availability.online)
                  }
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                disabled={
                  isSearching ||
                  !searchQuery.trim() ||
                  Boolean(busyPackage) ||
                  (availability?.installed === true && !availability.online)
                }
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                  <span>Found {searchResults.length} packages</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchResults([])}
                    className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Hide results
                  </Button>
                </div>

                <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card">
                  {searchResults.map((result) => (
                    <div
                      key={result.name}
                      className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{result.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {result.version}
                          </Badge>
                        </div>
                        {result.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {result.description}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        disabled={Boolean(busyPackage) || isNpmMissing}
                        onClick={() => installPackage(result)}
                        className="shrink-0"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Install
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {isMissingPackageJson && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
              <div className="flex items-start gap-4">
                <FileQuestion className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-base text-amber-900 dark:text-amber-200">
                    No package.json found
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    This project doesn&apos;t have a package.json file yet. Initialize one to start
                    managing dependencies.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleInitPackageJson}
                    disabled={isInitializingJson || isNpmMissing}
                    className="mt-2"
                  >
                    {isInitializingJson ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Package className="mr-2 h-4 w-4" />
                    )}
                    Initialize package.json
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Installed Packages</h2>
                <Badge variant="secondary">{packages.length} packages</Badge>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-xl border border-border/70 bg-card p-4 animate-pulse"
                    />
                  ))}
                </div>
              ) : packages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center text-muted-foreground">
                  No dependencies listed in package.json.
                </div>
              ) : (
                <div className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card overflow-hidden">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.name}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/50 ${
                        selectedPackage?.name === pkg.name ? 'bg-muted/80' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pkg.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {pkg.version}
                          </Badge>
                        </div>
                        <Badge
                          variant={pkg.dependencyType === 'development' ? 'secondary' : 'default'}
                          className="text-[10px]"
                        >
                          {pkg.dependencyType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={Boolean(busyPackage) || isNpmMissing}
                          onClick={(e) => {
                            e.stopPropagation()
                            runPackageAction(
                              pkg.name,
                              (installId) =>
                                tauriCommands.updateNpmPackage(project.path, pkg.name, installId),
                              `${pkg.name} updated to latest.`,
                              `Updating ${pkg.name}`
                            )
                          }}
                        >
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                          Latest
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-border/70 bg-card p-5 h-fit space-y-4">
              <h2 className="font-semibold text-lg">Package Details</h2>
              {selectedPackage ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base">{selectedPackage.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Installed: {selectedPackage.version} ({selectedPackage.dependencyType})
                    </p>
                  </div>

                  {isLoadingMetadata ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-4 w-1/2 bg-muted rounded" />
                    </div>
                  ) : metadata ? (
                    <div className="space-y-3 text-sm">
                      {metadata.description && (
                        <p className="text-muted-foreground text-xs">{metadata.description}</p>
                      )}
                      {metadata.license && (
                        <div className="text-xs">
                          <span className="font-medium text-foreground">License:</span>{' '}
                          {metadata.license}
                        </div>
                      )}
                      {metadata.homepage && (
                        <a
                          href={metadata.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Homepage <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ) : null}

                  <div className="pt-2 space-y-2 border-t">
                    <Label htmlFor="version-input" className="text-xs">
                      Change version / tag
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="version-input"
                        placeholder="e.g. 1.2.3 or latest"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        disabled={!version.trim() || Boolean(busyPackage) || isNpmMissing}
                        onClick={installVersion}
                      >
                        Install
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
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
                          `${selectedPackage.name} updated to latest.`,
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
        </>
      )}
    </div>
  )
}

export default NpmManagement
