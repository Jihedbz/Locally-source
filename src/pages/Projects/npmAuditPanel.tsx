import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAlertStore } from '@/store/alertStore'
import { NpmAuditReport, tauriCommands, useTauriErrorHandler } from '@/lib/tauriUtils'

interface NpmAuditPanelProps {
  projectPath: string
  projectName: string
  onFixStart?: (installId: string, actionTitle: string) => void
  onFixEnd?: () => void
  activeInstallId?: string | null
  isOffline?: boolean
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'moderate' | 'low'
type DependencyFilter = 'all' | 'direct' | 'transitive'

export const NpmAuditPanel: React.FC<NpmAuditPanelProps> = ({
  projectPath,
  projectName,
  onFixStart,
  onFixEnd,
  activeInstallId,
  isOffline = false,
}) => {
  const { show } = useAlertStore()
  const { handleError } = useTauriErrorHandler()

  const [report, setReport] = useState<NpmAuditReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [dependencyFilter, setDependencyFilter] = useState<DependencyFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({})

  const [isForceDialogOpen, setIsForceDialogOpen] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  const isBusy = isLoading || isFixing || Boolean(activeInstallId)

  const runAudit = useCallback(async () => {
    if (!projectPath) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await tauriCommands.auditNpmPackages(projectPath)
      setReport(data)
    } catch (err) {
      const message = handleError(err, 'auditing packages')
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [projectPath, handleError])

  useEffect(() => {
    runAudit()
  }, [runAudit])

  const handleFixAudit = async (force: boolean) => {
    if (!projectPath) return
    setIsFixing(true)
    setError(null)
    const installId = `audit-fix-${Date.now()}`
    const actionTitle = force ? 'Force Fixing Audit Issues' : 'Fixing Audit Issues'

    if (onFixStart) {
      onFixStart(installId, actionTitle)
    }

    try {
      await tauriCommands.fixNpmAudit({
        path: projectPath,
        force,
        installId,
      })
      show(
        'success',
        force
          ? `Audit force-fix applied to ${projectName}.`
          : `Audit fix completed for ${projectName}.`
      )
      // Re-run audit after fix
      await runAudit()
    } catch (err) {
      const message = handleError(err, 'fixing audit vulnerabilities')
      show('error', `Audit fix failed: ${message}`)
    } finally {
      setIsFixing(false)
      setIsForceDialogOpen(false)
      if (onFixEnd) {
        onFixEnd()
      }
    }
  }

  const toggleExpand = (packageName: string) => {
    setExpandedPackages((prev) => ({
      ...prev,
      [packageName]: !prev[packageName],
    }))
  }

  const filteredVulnerabilities = useMemo(() => {
    if (!report?.vulnerabilities) return []

    return report.vulnerabilities.filter((item) => {
      // Severity filter
      if (severityFilter !== 'all' && item.severity.toLowerCase() !== severityFilter) {
        return false
      }

      // Dependency type filter
      if (dependencyFilter === 'direct' && !item.isDirect) {
        return false
      }
      if (dependencyFilter === 'transitive' && item.isDirect) {
        return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = item.name.toLowerCase().includes(query)
        const matchesAdvisory = item.advisories.some((adv) =>
          adv.title?.toLowerCase().includes(query)
        )
        const matchesEffects = item.effects.some((eff) => eff.toLowerCase().includes(query))
        if (!matchesName && !matchesAdvisory && !matchesEffects) {
          return false
        }
      }

      return true
    })
  }, [report, severityFilter, dependencyFilter, searchQuery])

  const severityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
      case 'high':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
      case 'moderate':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      case 'low':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
      default:
        return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with summary stats and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Security Audit
          </h2>
          <p className="text-sm text-muted-foreground">
            Scan and remediate known vulnerabilities in {projectName}&apos;s dependency tree
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runAudit}
            disabled={isBusy || isOffline}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Scanning...' : 'Re-scan'}
          </Button>

          {report && report.summary.total > 0 && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleFixAudit(false)}
                disabled={isBusy || isOffline}
                className="gap-1.5"
              >
                {isFixing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4" />
                )}
                Fix Vulnerabilities
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsForceDialogOpen(true)}
                disabled={isBusy || isOffline}
                className="gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700"
              >
                <Zap className="h-4 w-4" />
                Force Fix...
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">You appear to be offline.</span> npm audit requires an
            active network connection to query the npm vulnerability registry.
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={runAudit} className="shrink-0">
            Retry
          </Button>
        </div>
      )}

      {/* Metrics Summary Row */}
      {report && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Card
            className={`cursor-pointer transition-all ${
              severityFilter === 'all' ? 'ring-2 ring-primary' : 'hover:border-primary/50'
            }`}
            onClick={() => setSeverityFilter('all')}
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium">Total Issues</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center justify-between">
                <span>{report.summary.total}</span>
                {report.summary.total === 0 ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all border-red-500/30 ${
              severityFilter === 'critical' ? 'ring-2 ring-red-500' : 'hover:border-red-500/50'
            }`}
            onClick={() => setSeverityFilter('critical')}
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-red-600 dark:text-red-400">
                Critical
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                {report.summary.critical}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all border-orange-500/30 ${
              severityFilter === 'high' ? 'ring-2 ring-orange-500' : 'hover:border-orange-500/50'
            }`}
            onClick={() => setSeverityFilter('high')}
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-orange-600 dark:text-orange-400">
                High
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {report.summary.high}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all border-amber-500/30 ${
              severityFilter === 'moderate' ? 'ring-2 ring-amber-500' : 'hover:border-amber-500/50'
            }`}
            onClick={() => setSeverityFilter('moderate')}
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Moderate
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {report.summary.moderate}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all border-blue-500/30 ${
              severityFilter === 'low' ? 'ring-2 ring-blue-500' : 'hover:border-blue-500/50'
            }`}
            onClick={() => setSeverityFilter('low')}
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Low
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {report.summary.low}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium">Dependencies</CardDescription>
              <CardTitle className="text-2xl font-bold text-muted-foreground">
                {report.summary.totalDependencies || '—'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      {report && report.summary.total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-muted/20 p-3 rounded-lg border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by package or advisory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
              <Filter className="h-3.5 w-3.5" />
              <span>Scope:</span>
            </div>

            <Button
              variant={dependencyFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => setDependencyFilter('all')}
            >
              All ({report.vulnerabilities.length})
            </Button>
            <Button
              variant={dependencyFilter === 'direct' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => setDependencyFilter('direct')}
            >
              Direct ({report.vulnerabilities.filter((v) => v.isDirect).length})
            </Button>
            <Button
              variant={dependencyFilter === 'transitive' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => setDependencyFilter('transitive')}
            >
              Transitive ({report.vulnerabilities.filter((v) => !v.isDirect).length})
            </Button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-lg border bg-card/50 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded-full" />
              </div>
              <div className="h-4 w-3/4 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Zero Vulnerabilities State */}
      {!isLoading && report && report.summary.total === 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="rounded-full bg-emerald-500/15 p-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight text-emerald-950 dark:text-emerald-100">
                Zero Vulnerabilities Detected
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                All {report.summary.totalDependencies} scanned packages in {projectName} pass npm
                security checks with no known CVE advisories.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vulnerabilities List */}
      {!isLoading && report && report.summary.total > 0 && (
        <div className="space-y-3">
          {filteredVulnerabilities.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <p>No vulnerabilities match the selected filters.</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSeverityFilter('all')
                  setDependencyFilter('all')
                  setSearchQuery('')
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            filteredVulnerabilities.map((vuln) => {
              const isExpanded = Boolean(expandedPackages[vuln.name])

              return (
                <Card
                  key={vuln.name}
                  className="transition-all hover:border-primary/40 overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between select-none"
                    onClick={() => toggleExpand(vuln.name)}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-base">{vuln.name}</span>
                        {vuln.range && (
                          <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                            {vuln.range}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={`uppercase text-[10px] font-bold tracking-wider ${severityBadgeColor(
                            vuln.severity
                          )}`}
                        >
                          {vuln.severity}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {vuln.isDirect ? 'Direct' : 'Transitive'}
                        </Badge>
                      </div>

                      {vuln.advisories.length > 0 && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {vuln.advisories[0].title || 'Vulnerability detected'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {vuln.fixAvailable && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Fix available
                        </span>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="border-t bg-muted/10 p-4 space-y-4 text-sm">
                      {/* Advisories Section */}
                      {vuln.advisories.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                            Advisories ({vuln.advisories.length})
                          </h4>
                          <div className="space-y-2">
                            {vuln.advisories.map((adv, idx) => (
                              <div
                                key={idx}
                                className="rounded-md border bg-background/60 p-3 space-y-1.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-medium text-sm">
                                    {adv.title || 'Security Advisory'}
                                  </span>
                                  {adv.url && (
                                    <a
                                      href={adv.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      View Advisory
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  {adv.range && <span>Vulnerable range: {adv.range}</span>}
                                  {adv.cwe.length > 0 && <span>CWE: {adv.cwe.join(', ')}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dependency Path / Via */}
                      {vuln.via.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                            Introduced Via
                          </h4>
                          <p className="text-xs text-muted-foreground font-mono bg-background/80 p-2 rounded border">
                            {vuln.via.join(' → ')}
                          </p>
                        </div>
                      )}

                      {/* Affected Dependents */}
                      {vuln.effects.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                            Depended on by
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {vuln.effects.map((eff) => (
                              <Badge key={eff} variant="outline" className="text-xs font-mono">
                                {eff}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fix Details */}
                      {vuln.fixAvailable && (
                        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 space-y-1 text-xs">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5" />
                            Remediation
                          </span>
                          <p className="text-muted-foreground">
                            {vuln.fixAvailable.name ? (
                              <>
                                Update <span className="font-mono">{vuln.fixAvailable.name}</span>
                                {vuln.fixAvailable.version && (
                                  <>
                                    {' '}
                                    to version{' '}
                                    <span className="font-mono">{vuln.fixAvailable.version}</span>
                                  </>
                                )}
                                {vuln.fixAvailable.isSemVerMajor && (
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1">
                                    (Major semver update)
                                  </span>
                                )}
                              </>
                            ) : (
                              'Run "Fix Vulnerabilities" or npm audit fix to resolve.'
                            )}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Force Fix Confirmation Dialog */}
      <Dialog open={isForceDialogOpen} onOpenChange={setIsForceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Force Fix Vulnerabilities
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2 text-sm">
              <p>
                Running{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                  npm audit fix --force
                </code>{' '}
                will upgrade dependencies to fix security issues even if it causes breaking major
                version changes.
              </p>
              <p className="text-amber-700 dark:text-amber-300 font-medium">
                Warning: Major version upgrades might introduce breaking API changes to your
                project.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsForceDialogOpen(false)}
              disabled={isFixing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleFixAudit(true)}
              disabled={isFixing}
              className="gap-1.5"
            >
              {isFixing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Proceed with Force Fix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default NpmAuditPanel
