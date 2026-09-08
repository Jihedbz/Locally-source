import { useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAlertStore } from '@/store/alertStore'
import { useProjectStore } from '@/store/projectStore'
import { Project } from '@/types/project'
import { Loader2 } from 'lucide-react'

interface FormState {
  name: string
  typescript: boolean
  eslint: boolean
  tailwind: boolean
  src: boolean
  turbopack: boolean
  appRouter: boolean
}

export function AddNextProjectDialog() {
  const [form, setForm] = useState<FormState>({
    name: '',
    typescript: true,
    eslint: true,
    tailwind: true,
    src: true,
    turbopack: false,
    appRouter: true,
  })
  const [isCreating, setIsCreating] = useState(false)
  const { show } = useAlertStore()
  const addProject = useProjectStore((state) => state.addProject)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (name: keyof FormState, value: boolean | string) => {
    console.log('handleChange called:', name, value)
    setForm((prev) => ({ ...prev, [name]: value }))
  }

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

      await invoke<string>('create_next_project', {
        name: projectName,
        typescript: form.typescript ? 'yes' : 'no',
        eslint: form.eslint ? 'yes' : 'no',
        tailwind: form.tailwind ? 'yes' : 'no',
        src: form.src ? 'yes' : 'no',
        appRouter: form.appRouter ? 'yes' : 'no',
        turbopack: form.turbopack ? 'yes' : 'no',
      })

      const newProject: Project = {
        name: projectName,
        path: fullProjectPath,
        type: 'next',
        createdAt: now,
        pinned: false,
      }

      await addProject(newProject)
      show('success', 'Project created successfully!')
      setForm({
        name: '',
        typescript: true,
        eslint: true,
        tailwind: true,
        src: true,
        turbopack: false,
        appRouter: true,
      })
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

  const options: { label: string; field: keyof FormState; description: string }[] = [
    { label: 'TypeScript', field: 'typescript', description: 'Create a TypeScript-first project.' },
    { label: 'ESLint', field: 'eslint', description: 'Enable linting by default.' },
    { label: 'Tailwind CSS', field: 'tailwind', description: 'Include Tailwind for styles.' },
    { label: 'Src/', field: 'src', description: 'Use the src/ folder layout.' },
    { label: 'Turbopack', field: 'turbopack', description: 'Enable modern Turbopack support.' },
    { label: 'App Router', field: 'appRouter', description: 'Use the App Router architecture.' },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <div className="rounded-3xl border border-border/70 bg-background/90 p-8 shadow-sm shadow-muted/10">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Next.js wizard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Create a new Next.js project
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Pick your defaults and scaffold a project instantly. Locally will keep track of your
            workspace metadata automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_280px] items-end">
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
                placeholder="e.g. portfolio-site"
                className="mt-2"
                disabled={isCreating}
              />
            </div>
            <div className="rounded-3xl border border-border/60 bg-muted/50 p-4">
              <p className="text-sm font-semibold text-foreground">Auto options</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Default recommended settings help you get started faster.
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            {options.map((option) => (
              <div
                key={option.field}
                className="flex items-start gap-3 rounded-3xl border border-border/60 bg-muted/50 p-4"
              >
                <Checkbox
                  id={option.field}
                  checked={!!form[option.field]}
                  onCheckedChange={(checked) => handleChange(option.field, !!checked)}
                  disabled={isCreating}
                />
                <div>
                  <label htmlFor={option.field} className="font-semibold text-foreground">
                    {option.label}
                  </label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Ready to generate?</p>
              <p>Locally will scaffold the project and persist the metadata for fast access.</p>
            </div>
            <Button type="submit" size="lg" disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '✨'}
              {isCreating ? 'Creating project...' : 'Create project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNextProjectDialog
