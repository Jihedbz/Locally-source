'use client'

import { useCallback, useEffect, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Pin, Plus, Search, FolderOpen, Sparkles, Filter, Grid3X3, List } from 'lucide-react'
import ProjectActions from './projectsActions'
import ProjectDetails from './projectDetails'
import { useNavigate } from 'react-router-dom'
import { Project } from '@/types/project'
import { useProjectStore } from '@/store/projectStore'
import { useProjects } from '@/hooks/useProjects'
import { getProjectIcon, getProjectColor } from '@/lib/projectUtils'

const Projects = () => {
  const navigate = useNavigate()
  const { searchQuery, setSearchQuery, viewMode, setViewMode } = useProjectStore()
  const { 
    filteredProjects, 
    selectedProject, 
    setSelectedProject, 
    loadProjects 
  } = useProjects()

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleProjectClick = useCallback((project: Project) => {
    setSelectedProject(project)
  }, [setSelectedProject])

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
            <div>
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <CardDescription className="capitalize">{project.type}</CardDescription>
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
          <div className="rounded-2xl bg-muted/50 p-3">{project.path}</div>
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
    <div className="flex-1 p-6">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border border-border/70 bg-background/80 shadow-sm">
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
                    Projects
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Project Center
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Create, browse and manage your development workspaces with an intelligent
                    dashboard and modern action flow.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button size="lg" onClick={() => navigate('/nextjs')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Next.js
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate('/angular')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Angular
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_0.7fr]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredProjects.length === 0 ? (
              <Card className="border border-border/70 bg-muted/40 p-8 text-center shadow-sm">
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="mt-6 space-y-3">
                  <h3 className="text-xl font-semibold">No projects yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a new project or use the quick create buttons above to populate your
                    workspace.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <Button size="sm" onClick={() => navigate('/nextjs')}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Next.js Starter
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/angular')}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Angular Starter
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div
                className={
                  viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'
                }
              >
                {filteredProjects.map((project) =>
                  viewMode === 'grid' ? (
                    <ProjectCard key={project.name} project={project} />
                  ) : (
                    <ProjectListItem key={project.name} project={project} />
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="border border-border/70 bg-background/80 shadow-sm">
            <CardHeader>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
                  Details panel
                </p>
                <CardTitle className="text-lg">Selected project</CardTitle>
                <CardDescription>
                  Select a project to review its metadata, open tools, and run workspace actions.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {selectedProject ? (
                <div className="space-y-4">
                  <ProjectActions />
                  <ProjectDetails />
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-border/50 bg-muted/40 p-8 text-center">
                  <p className="text-muted-foreground">
                    Click a project card to see its full details here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Projects
