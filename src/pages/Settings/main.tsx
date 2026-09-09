import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useSettingsStore } from '@/store/settingsStore'
import { useTheme } from '@/components/ui/themeprovider'
import { Monitor, Moon, Sun, FolderOpen, Code, Terminal, Settings, RotateCcw } from 'lucide-react'

const SettingsPage = () => {
  const { setTheme } = useTheme()
  const settings = useSettingsStore()
  const [tempSettings, setTempSettings] = useState(settings)

  const handleSave = () => {
    settings.updateSettings(tempSettings)
  }

  const handleReset = () => {
    settings.resetToDefaults()
    setTempSettings(useSettingsStore.getState())
  }

  return (
    <div className="min-h-full flex-1 px-4 py-5 md:px-6 md:py-7">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Application preferences
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Settings
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Customize your Locally experience.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" size="lg" onClick={handleReset} className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button size="lg" onClick={handleSave} className="w-full sm:w-auto">
              <Settings className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </header>

        <div className="grid gap-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color scheme
                  </p>
                </div>
                <Select
                  value={tempSettings.theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => {
                    setTempSettings({ ...tempSettings, theme: value })
                    setTheme(value)
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sidebar</Label>
                  <p className="text-sm text-muted-foreground">Start with sidebar collapsed</p>
                </div>
                <Switch
                  checked={tempSettings.sidebarCollapsed}
                  onCheckedChange={(checked) =>
                    setTempSettings({ ...tempSettings, sidebarCollapsed: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Project Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Projects
              </CardTitle>
              <CardDescription>Configure project-related preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-path">Default Project Path</Label>
                <Input
                  id="default-path"
                  placeholder="/home/user/projects"
                  value={tempSettings.defaultProjectPath}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, defaultProjectPath: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">Default location for new projects</p>
              </div>
            </CardContent>
          </Card>

          {/* Editor Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Editor
              </CardTitle>
              <CardDescription>Configure your preferred code editor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Preferred Editor</Label>
                  <p className="text-sm text-muted-foreground">Editor to open projects with</p>
                </div>
                <Select
                  value={tempSettings.preferredEditor}
                  onValueChange={(value: 'vscode' | 'cursor' | 'webstorm' | 'custom') =>
                    setTempSettings({ ...tempSettings, preferredEditor: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vscode">VS Code</SelectItem>
                    <SelectItem value="cursor">Cursor</SelectItem>
                    <SelectItem value="webstorm">WebStorm</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tempSettings.preferredEditor === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-editor">Custom Editor Path</Label>
                  <Input
                    id="custom-editor"
                    placeholder="/usr/bin/code"
                    value={tempSettings.customEditorPath}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, customEditorPath: e.target.value })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terminal Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Terminal
              </CardTitle>
              <CardDescription>Configure terminal preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Preferred Terminal</Label>
                  <p className="text-sm text-muted-foreground">Terminal application to use</p>
                </div>
                <Select
                  value={tempSettings.preferredTerminal}
                  onValueChange={(value: 'default' | 'custom') =>
                    setTempSettings({ ...tempSettings, preferredTerminal: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">System Default</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tempSettings.preferredTerminal === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-terminal">Custom Terminal Path</Label>
                  <Input
                    id="custom-terminal"
                    placeholder="/usr/bin/gnome-terminal"
                    value={tempSettings.customTerminalPath}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, customTerminalPath: e.target.value })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Updates & Development */}
          <Card>
            <CardHeader>
              <CardTitle>Updates & Development</CardTitle>
              <CardDescription>Application updates and development features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-check for Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically check for application updates
                  </p>
                </div>
                <Switch
                  checked={tempSettings.autoCheckUpdates}
                  onCheckedChange={(checked) =>
                    setTempSettings({ ...tempSettings, autoCheckUpdates: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Developer Tools</Label>
                  <p className="text-sm text-muted-foreground">
                    Show developer tools and debug information
                  </p>
                </div>
                <Switch
                  checked={tempSettings.showDevTools}
                  onCheckedChange={(checked) =>
                    setTempSettings({ ...tempSettings, showDevTools: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>Current configuration status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Theme: {tempSettings.theme}</Badge>
                <Badge variant="secondary">Editor: {tempSettings.preferredEditor}</Badge>
                <Badge variant="secondary">Terminal: {tempSettings.preferredTerminal}</Badge>
                {tempSettings.autoCheckUpdates && <Badge variant="secondary">Auto Updates</Badge>}
                {tempSettings.showDevTools && <Badge variant="secondary">Dev Tools</Badge>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
