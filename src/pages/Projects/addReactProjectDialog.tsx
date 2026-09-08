import { useRef, useState } from 'react'
import { appDataDir, join } from '@tauri-apps/api/path'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { useAlertStore } from '@/store/alertStore'
import { useProjectStore } from '@/store/projectStore'
import { tauriCommands } from '@/lib/tauriUtils'
import { Project } from '@/types/project'

export function AddReactProjectDialog() {
  const [isCreating, setIsCreating] = useState(false)
  const { show } = useAlertStore()
  const addProject = useProjectStore((state) => state.addProject)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const projectName = inputRef.current?.value.trim() || ''
    if (!projectName) {
      show('error', 'Project name is required')
      return
    }

    setIsCreating(true)
    try {
      const projectRoot = await join(await appDataDir(), 'projects')
      const projectPath = await join(projectRoot, projectName)
      await tauriCommands.createReactProject(projectName)
      const project: Project = {
        name: projectName,
        path: projectPath,
        type: 'react',
        createdAt: new Date().toISOString(),
        pinned: false,
      }
      await addProject(project)
      show('success', 'React project created successfully!')
      if (inputRef.current) inputRef.current.value = ''
    } catch (error) {
      show('error', error instanceof Error ? error.message : String(error))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="rounded-3xl border border-border/70 bg-background/90 p-8 shadow-sm">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">React wizard</p>
          <h1 className="text-3xl font-semibold tracking-tight">Create a new React project</h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Create a TypeScript Vite workspace and add it to your local project library.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="projectName">Project name</Label>
            <Input
              ref={inputRef}
              id="projectName"
              className="mt-2"
              placeholder="e.g. dashboard"
              disabled={isCreating}
            />
          </div>
          <Separator />
          <div className="rounded-2xl border border-border/60 bg-muted/50 p-4 text-sm text-muted-foreground">
            Vite and React with TypeScript will be configured automatically.
          </div>
          <Button type="submit" size="lg" disabled={isCreating}>
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isCreating ? 'Creating React project...' : 'Create React project'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default AddReactProjectDialog
