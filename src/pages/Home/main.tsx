import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, Clock3, FolderOpen, HardDrive, Layers3, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { tauriCommands } from '@/lib/tauriUtils'
import { getProjectIcon } from '@/lib/projectUtils'

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const getMostRecentProject = <T extends { createdAt?: string; name: string }>(projects: T[]) =>
  projects.reduce<T | null>((mostRecent, project) => {
    if (!mostRecent) return project
    const projectTime = Date.parse(project.createdAt || '')
    const mostRecentTime = Date.parse(mostRecent.createdAt || '')
    return projectTime > mostRecentTime ? project : mostRecent
  }, null)

const Home = () => {
  const projects = useProjectStore((state) => state.projects)
  const selectedProject = useProjectStore((state) => state.selectedProject)
  const setSelectedProject = useProjectStore((state) => state.setSelectedProject)
  const [totalDiskUsage, setTotalDiskUsage] = useState<number | null>(null)

  useEffect(() => {
    let isCurrent = true

    if (projects.length === 0) {
      setTotalDiskUsage(0)
      return () => {
        isCurrent = false
      }
    }

    setTotalDiskUsage(null)
    Promise.all(
      projects.map(async (project) => {
        try {
          return await tauriCommands.getDirSize(project.path)
        } catch {
          return 0
        }
      })
    ).then((sizes) => {
      if (isCurrent) setTotalDiskUsage(sizes.reduce((total, size) => total + size, 0))
    })

    return () => {
      isCurrent = false
    }
  }, [projects])

  const frameworkCounts = projects.reduce<Record<string, number>>((counts, project) => {
    const framework = project.type.toLowerCase()
    counts[framework] = (counts[framework] || 0) + 1
    return counts
  }, {})
  const frameworkSummary = Object.entries(frameworkCounts)
    .map(([framework, count]) => `${framework} ${count}`)
    .join(' / ')
  const lastActiveProject = selectedProject || getMostRecentProject(projects)

  const recentProjects = [...projects]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 5)

  return (
    <div className="min-h-full flex-1 px-4 py-5 md:px-6 md:py-7">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Workspace overview
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Home
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              A quick view of your local projects and workspace usage.
            </p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/projects">
              <FolderOpen className="mr-2 h-4 w-4" />
              Open project library
            </Link>
          </Button>
        </header>

        <section
          aria-label="Workspace statistics"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">Projects</span>
                <FolderOpen className="h-4 w-4" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{projects.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">In your local library</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">Disk used</span>
                <HardDrive className="h-4 w-4" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {totalDiskUsage === null ? '...' : formatBytes(totalDiskUsage)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">Frameworks</span>
                <Layers3 className="h-4 w-4" />
              </div>
              <p className="mt-4 truncate text-xl font-semibold tracking-tight">
                {frameworkSummary || 'None yet'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Projects by type</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">Last active</span>
                <Clock3 className="h-4 w-4" />
              </div>
              <p className="mt-4 truncate text-xl font-semibold tracking-tight">
                {lastActiveProject?.name || 'None yet'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Most recently selected</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Recent projects</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest workspaces at a glance.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">
                View all
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <FolderOpen className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 font-medium">No projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a project to start building your local library.
              </p>
              <Button asChild size="sm" className="mt-5">
                <Link to="/projects">
                  <Plus className="mr-2 h-4 w-4" />
                  Create project
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card">
              {recentProjects.map((project) => (
                <Link
                  key={project.name}
                  to="/projects"
                  onClick={() => setSelectedProject(project)}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    {getProjectIcon(project.type, 'text-xl')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{project.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{project.path}</p>
                  </div>
                  <div className="hidden items-center gap-3 sm:flex">
                    <Badge variant="outline" className="capitalize">
                      {project.type}
                    </Badge>
                    <span className="min-w-24 text-right text-xs text-muted-foreground">
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Home
