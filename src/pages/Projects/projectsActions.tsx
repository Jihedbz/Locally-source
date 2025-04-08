import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
        DropdownMenuItem, DropdownMenuPortal, DropdownMenuSubTrigger, 
        DropdownMenuSubContent, DropdownMenuGroup,
        DropdownMenuSub } from "@/components/ui/dropdown-menu";
import { FolderOpen, Pin, Trash2, Play, Trash } from "lucide-react";
import { writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs"; 
import { useAlertStore } from "@/store/alertStore";
import React from "react";
import { invoke } from "@tauri-apps/api/core";

type ProjectActionsProps = {
  project: any;
  projects: any[];
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
};

const ProjectActions: React.FC<ProjectActionsProps> = ({ project, projects, setProjects }) => {
  const PROJECTS_FILE = "projects/projects.json";
  const { show } = useAlertStore();
  const [os, setOs] = React.useState<string | null>(null);

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

  // Save projects after any update
  const saveProjects = async (updatedProjects: any[]) => {
    try {
      await writeTextFile(PROJECTS_FILE, JSON.stringify(updatedProjects, null, 2), {
        baseDir: BaseDirectory.AppData,
      });
    } catch (error) {
      console.error("Failed to save project list:", error);
      show('error', "Error saving project list!");
    }
  };

  // Open project in Explorer using Rust command
  const handleOpenInExplorer = async (path: string) => {
    try {
      const result = await invoke<string>("open_in_explorer", { path });
      console.log(`Opening ${project.name} in Explorer at: ${path}`);
      show('success', `Opened "${project.name}" in Explorer.`);
    } catch (error) {
      console.error('Failed to open in Explorer:', error);
      show('error', `Failed to open "${project.name}" in Explorer.`);
    }
  };

  // Open project in VSCode using Rust command
  const handleOpenInVSCode = async (path: string) => {
    try {
      const result = await invoke<string>("open_in_vscode", { path });
      console.log(`Opening ${project.name} in VSCode at: ${path}`);
      show('success', `Opened "${project.name}" in VSCode.`);
    } catch (error) {
      console.error('Failed to open in VSCode:', error);
      show('error', `Failed to open "${project.name}" in VSCode. Make sure VS Code is installed.`);
    }
  };

  // Open terminal using Rust command
  const handleOpenTerminal = async (path: string) => {
    try {
      const result = await invoke<string>("open_terminal", { path });
      console.log(`Opening terminal in: ${path}`);
      show('success', `Opened terminal in "${path}".`);
    } catch (error) {
      console.error('Failed to open terminal:', error);
      show('error', `Failed to open terminal in "${path}": ${error}`);
    }
  };

  // Clean project - remove temporary files and directories
  const handleCleanProject = async (path: string) => {
    try {
      const confirmed = confirm(`Clean "${project.name}" project? This will remove node_modules, build directories, and other temporary files.`);
      if (!confirmed) return;
      
      const result = await invoke<string>("clean_project", { path });
      console.log(`Cleaned project at: ${path}`);
      show('success', result);
    } catch (error) {
      console.error('Failed to clean project:', error);
      show('error', `Failed to clean "${project.name}": ${error}`);
    }
  };

  // Toggle Pin project
  const togglePinProject = (projectName: string) => {
    const updatedProjects = projects.map((p) =>
      p.name === projectName ? { ...p, pinned: !p.pinned } : p
    );
    updatedProjects.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)); // Move pinned projects to top
    setProjects(updatedProjects);
    saveProjects(updatedProjects);
    show('success', `Project "${projectName}" ${updatedProjects.find(p => p.name === projectName)?.pinned ? 'pinned' : 'unpinned'}.`);
  };

  // Delete project using Rust command
  const handleDeleteProject = async (project: any) => {
    const confirmed = confirm(`Are you sure you want to delete ${project.name}?`);
    if (!confirmed) return;

    try {
      await invoke<string>("delete_project", { path: project.path });
      
      const updatedProjects = projects.filter(p => p.name !== project.name);
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      
      show('success', `Project "${project.name}" deleted successfully!`);
    } catch (error) {
      console.error("Failed to delete project:", error);
      show('error', `Error deleting project: ${error}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Open with
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleOpenInExplorer(project.path)}>
                  <FolderOpen className="mr-2" />
                  Explorer
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleOpenInVSCode(project.path)}>
                  <i className="devicon-vscode-plain mr-2" />
                  Vs Code
                </DropdownMenuItem> 

                <DropdownMenuItem onClick={() => handleOpenTerminal(project.path)}>
                  <i className="devicon-powershell-plain mr-2" />
                  Terminal
                </DropdownMenuItem> 
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuItem onClick={() => togglePinProject(project.name)}>
          <Pin className="mr-2" />
          {project.pinned ? 'Unpin' : 'Pin'}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Play className="mr-2"/>
          Start
        </DropdownMenuItem>
        
        {/* New Clean Project option */}
        <DropdownMenuItem onClick={() => handleCleanProject(project.path)}>
          <Trash className="mr-2" />
          Clean Project
        </DropdownMenuItem>
        
        <DropdownMenuItem disabled>
          <i className="mr-2 devicon-npm-original-wordmark"></i>
          Npm
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <i className="mr-2 devicon-docker-plain"></i>
          Docker
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <i className="mr-2 devicon-git-plain"></i>
          Git
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleDeleteProject(project)}>
          <Trash2 className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProjectActions;