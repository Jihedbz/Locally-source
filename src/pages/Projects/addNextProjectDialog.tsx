import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { writeTextFile, readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path"; // Import 'join'
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAlertStore } from "@/store/alertStore";

interface Project {
  name: string;
  path: string;
  type: string;
  createdAt: string;
}

interface FormState {
  name: string;
  typescript: boolean;
  eslint: boolean;
  tailwind: boolean;
  src: boolean;
  turbopack: boolean;
  appRouter: boolean;
}

export function AddNextProjectDialog() {
  const [form, setForm] = useState<FormState>({
    name: "",
    typescript: false,
    eslint: false,
    tailwind: false,
    src: false,
    turbopack: false,
    appRouter: false,
  });

  const { show } = useAlertStore();

  const handleChange = (name: keyof FormState, value: boolean | string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      show('error', "Project name is required");
      return;
    }

    try {
      const appDataDirPath = await appDataDir();
      const baseProjectPath = await join(appDataDirPath, "projects"); // Use 'join' for path construction
      const fullProjectPath = await join(baseProjectPath, form.name); // Full path including project name
      const now = new Date().toISOString();

      const result = await invoke<string>("create_next_project", {
        name: form.name,
        typescript: form.typescript ? "yes" : "no",
        eslint: form.eslint ? "yes" : "no",
        tailwind: form.tailwind ? "yes" : "no",
        src: form.src ? "yes" : "no",
        appRouter: form.appRouter ? "yes" : "no",
        turbopack: form.turbopack ? "yes" : "no",
      });

      const newProject: Project = {
        name: form.name,
        path: fullProjectPath, // Use the full project path
        type: "Next",
        createdAt: now,
      };

      await saveProject(newProject);
      show('success', "Project created at /projects");
      setForm({ name: "", typescript: false, eslint: false, tailwind: false, src: false, turbopack: false, appRouter: false });
    } catch (error) {
      console.error("Failed to save project:", error);
      show('error', error instanceof Error ? error.message : String(error));


    }
  };

  const saveProject = async (project: Project) => {
    try {
      const filePath = "projects/projects.json";
      let projects: Project[] = [];

      try {
        const data = await readTextFile(filePath, { baseDir: BaseDirectory.AppData });
        projects = JSON.parse(data);
      } catch (error) {
        if (!(error instanceof Error && error.message.includes("File not found"))) {
          throw error;
        }
      }

      projects.push(project);
      await writeTextFile(filePath, JSON.stringify(projects, null, 2), { baseDir: BaseDirectory.AppData, create: true });
    } catch (error) {
      show('error', error instanceof Error ? error.message : String(error));

    }
  };

  const options: { label: string; field: keyof FormState; description: string }[] = [
    { label: "TypeScript", field: "typescript", description: "Initialize as a TypeScript project" },
    { label: "ESLint", field: "eslint", description: "Initialize with ESLint config" },
    { label: "Tailwind CSS", field: "tailwind", description: "Initialize with Tailwind CSS config" },
    { label: "Src/", field: "src", description: "Initialize inside a 'src/' directory" },
    { label: "Turbopack", field: "turbopack", description: "Enable Turbopack by default for development" },
    { label: "AppRouter", field: "appRouter", description: "Initialize as an App Router project" },
  ];

  return (
    <div className="w-full max-w-3xl px-6 mx-auto space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">🚀 Spin Up a New Next.js Project</h1>
        <p className="text-sm text-muted-foreground">
          Configure your setup quickly — dependencies won’t be installed just yet for ⚡ instant scaffolding.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="projectName" className="text-right">
              📝 Project Name
            </Label>
            <Input
              className="col-span-3"
              id="projectName"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., portfolio-site"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-base font-semibold">🛠️ Customize Your Stack</Label>
          <div className="grid gap-4">
            {options.map((option) => (
              <div className="flex items-start space-x-3" key={option.field}>
                <Checkbox
                  id={option.field}
                  checked={!!form[option.field]}
                  onCheckedChange={(checked) => handleChange(option.field, !!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor={option.field} className="text-sm font-medium leading-none">
                    {option.label}
                  </label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-right">
          <Button type="submit">✨ Generate Project</Button>
        </div>
      </form>

      
    </div>
  );
}

export default AddNextProjectDialog;