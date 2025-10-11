// Button and dropdown UI components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuGroup,
  DropdownMenuSub,
} from "@/components/ui/dropdown-menu";

// Icons used in the dropdown
import { FolderOpen, Pin, Trash2, Play, Recycle } from "lucide-react";

// Tauri APIs to write files
import { writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";

// Alert store for showing feedback messages to the user
import { useAlertStore } from "@/store/alertStore";

import React from "react";
import { invoke } from "@tauri-apps/api/core"; // Used to call backend Rust commands

// Props expected by ProjectActions component
type ProjectActionsProps = {
  project: any;
  projects: any[];
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
};

const ProjectActions: React.FC<ProjectActionsProps> = ({
  project,
  projects,
  setProjects,
}) => {
  const PROJECTS_FILE = "projects/projects.json"; // Path to projects JSON file in AppData
  const { show } = useAlertStore(); // Alert function from global store
  const [, setOs] = React.useState<string | null>(null);

  // Detect the current operating system using a Rust command
  React.useEffect(() => {
    const getOperatingSystem = async () => {
      try {
        const currentOs = await invoke<string>("get_operating_system");
        setOs(currentOs);
      } catch (error) {
        console.error("Failed to get OS:", error);
        setOs("unknown");
      }
    };
    getOperatingSystem();
  }, []);

  // Save the updated project list to file
  const saveProjects = async (updatedProjects: any[]) => {
    try {
      await writeTextFile(
        PROJECTS_FILE,
        JSON.stringify(updatedProjects, null, 2),
        { baseDir: BaseDirectory.AppData }
      );
    } catch (error) {
      console.error("Failed to save project list:", error);
      show("error", "Error saving project list!");
    }
  };

  // Open the project directory in Explorer/Finder
  const handleOpenInExplorer = async (path: string) => {
    try {
      const result = await invoke<string>("open_in_explorer", { path });
      console.log(result);
      show("success", `Opened "${project.name}" in Explorer.`);
    } catch (error) {
      console.error("Failed to open in Explorer:", error);
      show("error", `Failed to open "${project.name}" in Explorer.`);
    }
  };

  // Open the project folder in VSCode
  const handleOpenInVSCode = async (path: string) => {
    try {
      const result = await invoke<string>("open_in_vscode", { path });
      console.log(result);
      show("success", `Opened "${project.name}" in VSCode.`);
    } catch (error) {
      console.error("Failed to open in VSCode:", error);
      show(
        "error",
        `Failed to open "${project.name}" in VSCode. Make sure VS Code is installed.`
      );
    }
  };

  // Open a terminal in the project folder
  const handleOpenTerminal = async (path: string) => {
    try {
      const result = await invoke<string>("open_terminal", { path });
      console.log(result);
      show("success", `Opened terminal in "${path}".`);
    } catch (error) {
      console.error("Failed to open terminal:", error);
      show("error", `Failed to open terminal in "${path}": ${error}`);
    }
  };

  // Clean the project (remove node_modules, dist, build, etc.)
  const handleCleanProject = async (path: string) => {
    try {
      const confirmed = confirm(
        `Clean "${project.name}" project? This will remove node_modules, build directories, and other temporary files.`
      );
      if (!confirmed) return;

      const result = await invoke<string>("clean_project", { path });
      console.log(`Cleaned project at: ${path}`);
      show("success", result);
      await getFolderSize(path);
    } catch (error) {
      console.error("Failed to clean project:", error);
      show("error", `Failed to clean "${project.name}": ${error}`);
    }
  };

  const getFolderSize = async (path: string): Promise<string> => {
    try {
      const size = await invoke<number>("get_dir_size", { path });
      return size ? `${(size / (1024 * 1024)).toFixed(2)} MB` : "0 MB";
    } catch (error) {
      console.error("Error fetching folder size:", error);
      return "Error calculating size";
    }
  };

  // Pin or unpin the project
  const togglePinProject = (projectName: string) => {
    const updatedProjects = projects.map((p) =>
      p.name === projectName ? { ...p, pinned: !p.pinned } : p
    );

    // Move pinned projects to the top
    updatedProjects.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    setProjects(updatedProjects);
    saveProjects(updatedProjects);

    const pinned = updatedProjects.find((p) => p.name === projectName)?.pinned;
    show(
      "success",
      `Project "${projectName}" ${pinned ? "pinned" : "unpinned"}.`
    );
  };

  // Delete project permanently
  const handleDeleteProject = async (project: any) => {
    const confirmed = confirm(
      `Are you sure you want to delete ${project.name}?`
    );
    if (!confirmed) return;

    try {
      await invoke<string>("delete_project", { path: project.path });

      const updatedProjects = projects.filter((p) => p.name !== project.name);
      setProjects(updatedProjects);
      saveProjects(updatedProjects);

      show("success", `Project "${project.name}" deleted successfully!`);
    } catch (error) {
      console.error("Failed to delete project:", error);
      show("error", `Error deleting project: ${error}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {/* Open options (Explorer, VSCode, Terminal) */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Open with</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => handleOpenInExplorer(project.path)}
                >
                  <FolderOpen className="mr-2" />
                  Explorer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenInVSCode(project.path)}
                >
                  <i className="devicon-vscode-plain mr-2" />
                  Vs Code
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenTerminal(project.path)}
                >
                  <i className="devicon-powershell-plain mr-2" />
                  Terminal
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* Toggle pin */}
        <DropdownMenuItem onClick={() => togglePinProject(project.name)}>
          <Pin className="mr-2" />
          {project.pinned ? "Unpin" : "Pin"}
        </DropdownMenuItem>

        {/* Placeholder: not yet implemented */}
        <DropdownMenuItem>
          <Play className="mr-2" />
          Start
        </DropdownMenuItem>

        {/* Clean project */}
        <DropdownMenuItem onClick={() => handleCleanProject(project.path)}>
          <Recycle className="mr-2" />
          Clean
        </DropdownMenuItem>

        {/* Disabled option for future NPM actions */}
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <i className="mr-5 devicon-npm-original-wordmark" />
              Npm
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem disabled>
                  <i className="devicon-npm-original-wordmark mr-2" />
                  Install
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <i className="devicon-npm-original-wordmark mr-2" />
                  Update
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <i className="devicon-npm-original-wordmark mr-2" />
                  Uninstall
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>

        {/* Delete project */}
        <DropdownMenuItem onClick={() => handleDeleteProject(project)}>
          <Trash2 className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProjectActions;
