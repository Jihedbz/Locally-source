'use client'

import { useCallback, useEffect, memo, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Clock3,
  ChevronDown,
  FolderOpen,
  FolderPlus,
  Grid3X3,
  List,
  Pin,
  Plus,
  Search,
  Sparkles,
  SlidersHorizontal,
  Tag,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ProjectActions from './projectsActions'
import ProjectDetails from './projectDetails'
import { useNavigate } from 'react-router-dom'
import { Project } from '@/types/project'
import { useProjectStore } from '@/store/projectStore'
import { useProjects } from '@/hooks/useProjects'
import { getProjectIcon, getProjectColor } from '@/lib/projectUtils'

const Projects = () => {
  const navigate = useNavigate()
  const [tagFilter, setTagFilter] = useState('all')
  const { searchQuery, setSearchQuery, viewMode, setViewMode, projects, isLoading } =
    useProjectStore()
  const { filteredProjects, selectedProject, setSelectedProject, loadProjects } =
    useProjects(tagFilter)

  const availableTags = useMemo(
    () =>
      Array.from(new Set(projects.flatMap((project) => project.tags || []))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [projects]
  )

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (tagFilter !== 'all' && !availableTags.includes(tagFilter)) {
      setTagFilter('all')
    }
  }, [availableTags, tagFilter])

  const handleProjectClick = useCallback(
    (project: Project) => {
      setSelectedProject(project)
    },
    [setSelectedProject]
  )

  const ProjectCard = memo(({ project }: { project: Project }) => (
    <Card
      className={`hover-lift cursor-pointer transition-all duration-300 shadow-sm ${getProjectColor(project.type)} border bg-background/70 ${
        selectedProject?.name === project.name ? 'ring-2 ring-primary' : 'border-opacity-80'
      }`}
      onClick={() => handleProjectClick(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              {getProjectIcon(project.type)}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <CardDescription className="capitalize">{project.type}</CardDescription>
              {project.tags && project.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          {project.pinned && (
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
              <Pin className="mr-1 h-3.5 w-3.5" />
              Pinned
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-sm text-muted-foreground">
          <div
            className="min-w-0 max-w-full overflow-hidden rounded-2xl bg-muted/50 p-3 text-xs leading-5 break-all text-muted-foreground"
            title={project.path}
          >
            {project.path}
          </div>
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
            <span>
              {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
            <span>{project.type.toUpperCase()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ))

  const ProjectListItem = memo(({ project }: { project: Project }) => (
    <Card
      className={`hover-lift cursor-pointer transition-all duration-300 shadow-sm ${getProjectColor(project.type)} border bg-background/70 ${
        selectedProject?.name === project.name ? 'ring-2 ring-primary' : 'border-opacity-80'
      }`}
      onClick={() => handleProjectClick(project)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
              {getProjectIcon(project.type)}
            </div>
            <div>
              <h3 className="font-semibold text-base">{project.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{project.type}</p>
              {project.tags && project.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{new Date(project.createdAt || Date.now()).toLocaleDateString()}</p>
            {project.pinned && <Badge variant="secondary">Pinned</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  ))

  return (
    <div className="min-h-full flex-1 px-4 py-5 md:px-6 md:py-7">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              Workspace library
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Projects
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Keep your local development workspaces close, searchable, and ready to open.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                New project
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Choose a framework</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/nextjs')}>
                <span className="flex w-5 items-center justify-center">
                  {getProjectIcon('nextjs', 'text-base')}
                </span>
                Next.js
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/angular')}>
                <span className="flex w-5 items-center justify-center">
                  {getProjectIcon('angular', 'text-base')}
                </span>
                Angular
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/react')}>
                <span className="flex w-5 items-center justify-center">
                  {getProjectIcon('react', 'text-base')}
                </span>
                React
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/vue')}>
                <span className="flex w-5 items-center justify-center">
                  {getProjectIcon('vue', 'text-base')}
                </span>
                Vue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="grid grid-cols-2 divide-x rounded-2xl border border-border/70 bg-card/60 md:grid-cols-4">
          <div className="p-4 md:px-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Total
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{projects.length}</p>
          </div>
          <div className="p-4 md:px-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Showing
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{filteredProjects.length}</p>
          </div>
          <div className="hidden p-4 md:block md:px-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Pinned
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {projects.filter((project) => project.pinned).length}
            </p>
          </div>
          <div className="hidden p-4 md:block md:px-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Latest
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              {projects.length > 0 ? 'Active library' : 'Ready to start'}
            </p>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search projects"
                  placeholder="Search by name or framework"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 border-0 bg-muted/60 pl-10 shadow-none focus-visible:ring-1"
                />
              </div>
              <div className="flex items-center gap-2 border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <select
                  aria-label="Filter by tag"
                  value={tagFilter}
                  onChange={(event) => setTagFilter(event.target.value)}
                  className="h-10 rounded-md border-0 bg-muted/60 px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="all">All tags</option>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <span className="mr-auto flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground sm:hidden">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> View
                </span>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-semibold tracking-tight">Your workspaces</h2>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : tagFilter !== 'all'
                      ? `Filtered by tag: ${tagFilter}`
                      : 'Select a project to view its details'}
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
              </span>
            </div>

            {isLoading ? (
              <div className="grid gap-3 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-36 animate-pulse rounded-2xl border border-border/60 bg-muted/50"
                  />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background">
                  {searchQuery || tagFilter !== 'all' ? (
                    <Search className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <FolderPlus className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <h3 className="mt-5 font-semibold">
                  {searchQuery || tagFilter !== 'all' ? 'No matching projects' : 'Your library is empty'}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  {searchQuery || tagFilter !== 'all'
                    ? 'Try a different name, framework, or tag.'
                    : 'Create a workspace to start building your local project library.'}
                </p>
                {!searchQuery && tagFilter === 'all' && (
                  <Button className="mt-5" onClick={() => navigate('/nextjs')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create your first project
                  </Button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid gap-3 md:grid-cols-2' : 'space-y-3'}>
                {filteredProjects.map((project) =>
                  viewMode === 'grid' ? (
                    <ProjectCard key={project.name} project={project} />
                  ) : (
                    <ProjectListItem key={project.name} project={project} />
                  )
                )}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/80">
              <div className="border-b border-border/70 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Workspace focus
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">Selected project</h2>
              </div>
              <div className="p-4">
                {selectedProject ? (
                  <div className="space-y-4">
                    <ProjectActions />
                    <ProjectDetails />
                  </div>
                ) : (
                  <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/30 px-6 text-center">
                    <FolderOpen className="h-7 w-7 text-muted-foreground" />
                    <p className="mt-4 text-sm font-medium">Nothing selected</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Choose a workspace from the library to inspect it here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Projects
