import { useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAlertStore } from '@/store/alertStore'
import { useProjectStore } from '@/store/projectStore'
import { Project } from '@/types/project'
import { Loader2 } from 'lucide-react'

export function AddAngularProjectDialog() {
  const [isCreating, setIsCreating] = useState(false)
  const { show } = useAlertStore()
  const addProject = useProjectStore((state) => state.addProject)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const projectName = inputRef.current?.value || ''
    if (!projectName.trim()) {
      show('error', 'Project name is required')
      return
    }

    setIsCreating(true)
    try {
      const appDataDirPath = await appDataDir()
      const baseProjectPath = await join(appDataDirPath, 'projects')
      const fullProjectPath = await join(baseProjectPath, projectName)
      const now = new Date().toISOString()

      await invoke<string>('create_angular_project', { name: projectName })

      const newProject: Project = {
        name: projectName,
        path: fullProjectPath,
        type: 'angular',
        createdAt: now,
        pinned: false,
      }

      await addProject(newProject)
      show('success', 'Angular project created successfully!')
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      show('error', error instanceof Error ? error.message : String(error))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="rounded-3xl border border-border/70 bg-background/90 p-8 shadow-sm shadow-muted/10">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Angular configuration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Create a new Angular project
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Build a polished Angular workspace with a single click and save it in your Locally
            library.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label
              htmlFor="projectName"
              className="block text-sm font-medium text-muted-foreground"
            >
              Project name
            </Label>
            <Input
              ref={inputRef}
              id="projectName"
              type="text"
              defaultValue=""
              placeholder="e.g. admin-dashboard"
              className="mt-2"
              disabled={isCreating}
            />
          </div>

          <Separator />

          <div className="rounded-3xl border border-border/60 bg-muted/50 p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Angular setup</p>
            <p className="mt-2">
              This scaffold uses the default Angular workspace structure, with app routing enabled
              by default.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Get started fast</p>
              <p>
                Locally will store the project metadata and make it available in the Projects
                dashboard.
              </p>
            </div>
            <Button type="submit" size="lg" disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '✨'}
              {isCreating ? 'Creating Angular project...' : 'Create Angular project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddAngularProjectDialog
