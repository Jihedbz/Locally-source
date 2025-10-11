// React hooks and Tauri APIs
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  writeTextFile,
  readTextFile,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";

// Custom UI components and global store
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAlertStore } from "@/store/alertStore";

// Type definition for a saved project entry
interface Project {
  name: string;
  path: string;
  type: string;
  createdAt: string;
  pinned: boolean;
}

// Local form state for controlling the Next.js config options
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
  // Form state for user inputs and feature toggles
  const [form, setForm] = useState<FormState>({
    name: "",
    typescript: false,
    eslint: false,
    tailwind: false,
    src: false,
    turbopack: false,
    appRouter: false,
  });

  // Alert system to show feedback to the user
  const { show } = useAlertStore();

  // Updates the form state when user types or toggles a checkbox
  const handleChange = (name: keyof FormState, value: boolean | string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Triggered when user submits the form to create a Next.js project
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate project name
    if (!form.name.trim()) {
      show("error", "Project name is required");
      return;
    }

    try {
      // Construct project path inside the app's data directory
      const appDataDirPath = await appDataDir();
      const baseProjectPath = await join(appDataDirPath, "projects");
      const fullProjectPath = await join(baseProjectPath, form.name);

      const now = new Date().toISOString();

      // Invoke the Rust command to scaffold the project
      const result = await invoke<string>("create_next_project", {
        name: form.name,
        typescript: form.typescript ? "yes" : "no",
        eslint: form.eslint ? "yes" : "no",
        tailwind: form.tailwind ? "yes" : "no",
        src: form.src ? "yes" : "no",
        appRouter: form.appRouter ? "yes" : "no",
        turbopack: form.turbopack ? "yes" : "no",
      });

      console.log(result);

      // Construct a new project object
      const newProject: Project = {
        name: form.name,
        path: fullProjectPath,
        type: "Next",
        createdAt: now,
        pinned: false,
      };

      // Save the project metadata to `projects.json`
      await saveProject(newProject);

      // Notify user and reset form
      show("success", "Project created at /projects");
      setForm({
        name: "",
        typescript: false,
        eslint: false,
        tailwind: false,
        src: false,
        turbopack: false,
        appRouter: false,
      });
    } catch (error) {
      console.error("Failed to save project:", error);
      show("error", error instanceof Error ? error.message : String(error));
    }
  };

  // Saves the new project entry to projects.json (inside AppData)
  const saveProject = async (project: Project) => {
    try {
      const filePath = "projects/projects.json";
      const appDataDirPath = await appDataDir();
      const fullFilePath = await join(appDataDirPath, filePath);
      let projects: Project[] = [];

      console.log("Attempting to save project:", project);
      console.log("Full file path for projects.json:", fullFilePath);

      try {
        // Try reading existing projects
        const data = await readTextFile(filePath, {
          baseDir: BaseDirectory.AppData,
        });
        projects = JSON.parse(data);
        console.log("Existing projects.json content:", projects);
      } catch (readError) {
        // Handle file not found — initialize new array
        if (
          !(
            readError instanceof Error &&
            readError.message.includes("File not found")
          )
        ) {
          console.error("Error reading projects.json:", readError);
          show(
            "error",
            readError instanceof Error ? readError.message : String(readError)
          );
          return;
        }
        console.log("projects.json not found, initializing empty array.");
      }

      // Append new project and write back
      projects.push(project);
      const jsonData = JSON.stringify(projects, null, 2);
      await writeTextFile(filePath, jsonData, {
        baseDir: BaseDirectory.AppData,
        create: true,
      });
      console.log("Project saved to projects.json successfully.");
    } catch (writeError) {
      console.error("Error writing to projects.json:", writeError);
      show(
        "error",
        writeError instanceof Error ? writeError.message : String(writeError)
      );
    }
  };

  // Available Next.js configuration options
  const options: {
    label: string;
    field: keyof FormState;
    description: string;
  }[] = [
    {
      label: "TypeScript",
      field: "typescript",
      description: "Initialize as a TypeScript project",
    },
    {
      label: "ESLint",
      field: "eslint",
      description: "Initialize with ESLint config",
    },
    {
      label: "Tailwind CSS",
      field: "tailwind",
      description: "Initialize with Tailwind CSS config",
    },
    {
      label: "Src/",
      field: "src",
      description: "Initialize inside a 'src/' directory",
    },
    {
      label: "Turbopack",
      field: "turbopack",
      description: "Enable Turbopack by default for development",
    },
    {
      label: "AppRouter",
      field: "appRouter",
      description: "Initialize as an App Router project",
    },
  ];

  return (
    <div className="w-full max-w-3xl px-6 mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          🚀 Spin Up a New Next.js Project
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure your setup quickly — dependencies won’t be installed just
          yet for ⚡ instant scaffolding.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project name input */}
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

        {/* Options checkboxes */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">
            🛠️ Customize Your Application
          </Label>
          <div className="grid gap-4">
            {options.map((option) => (
              <div className="flex items-start space-x-3" key={option.field}>
                <Checkbox
                  id={option.field}
                  checked={!!form[option.field]}
                  onCheckedChange={(checked) =>
                    handleChange(option.field, !!checked)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={option.field}
                    className="text-sm font-medium leading-none"
                  >
                    {option.label}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div className="text-right">
          <Button type="submit">✨ Generate Project</Button>
        </div>
      </form>
    </div>
  );
}

export default AddNextProjectDialog;
