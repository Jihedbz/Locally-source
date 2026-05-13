import { useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { writeTextFile, readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { appDataDir, join } from '@tauri-apps/api/path'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAlertStore } from '@/store/alertStore'

interface Project {
  name: string
  path: string
  type: string
  createdAt: string
  pinned: boolean
}

export function AddAngularProjectDialog() {
  const { show } = useAlertStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const projectName = inputRef.current?.value || ''
    if (!projectName.trim()) {
      show('error', 'Project name is required')
      return
    }

    try {
      const appDataDirPath = await appDataDir()
      const baseProjectPath = await join(appDataDirPath, 'projects')
      const fullProjectPath = await join(baseProjectPath, projectName)
      const now = new Date().toISOString()

      await invoke<string>('create_angular_project', { name: projectName })

      const newProject: Project = {
        name: projectName,
        path: fullProjectPath,
        type: 'Angular',
        createdAt: now,
        pinned: false,
      }

      await saveProject(newProject)
      show('success', 'Angular project created successfully!')
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      show('error', error instanceof Error ? error.message : String(error))
    }
  }

  const saveProject = async (project: Project) => {
    try {
      const filePath = 'projects/projects.json'
      let projects: Project[] = []
      try {
        const data = await readTextFile(filePath, { baseDir: BaseDirectory.AppData })
        projects = JSON.parse(data)
      } catch (readError) {
        if (!(readError instanceof Error && readError.message.includes('File not found'))) {
          throw readError
        }
      }
      projects.push(project)
      await writeTextFile(filePath, JSON.stringify(projects, null, 2), {
        baseDir: BaseDirectory.AppData,
        create: true,
      })
    } catch (writeError) {
      console.error('Error writing to projects.json:', writeError)
      show('error', writeError instanceof Error ? writeError.message : String(writeError))
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
            <Button type="submit" size="lg">
              ✨ Create Angular project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddAngularProjectDialog
