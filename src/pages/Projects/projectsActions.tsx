// ProjectActions.tsx
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
        DropdownMenuItem, DropdownMenuPortal,  DropdownMenuSubTrigger, 
        DropdownMenuSubContent , DropdownMenuGroup,
        DropdownMenuSub} from "@/components/ui/dropdown-menu";
import { FolderOpen, Pin, Trash2, Play } from "lucide-react";
import { writeTextFile, BaseDirectory, remove } from "@tauri-apps/plugin-fs"; 
import { join } from '@tauri-apps/api/path';
const { open } = await import("@tauri-apps/plugin-shell");

type ProjectActionsProps = {
  project: any;
  projects: any[];
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
};

const ProjectActions: React.FC<ProjectActionsProps> = ({ project, projects, setProjects }) => {
    const PROJECTS_FILE = "projects/projects.json";
  // Save projects after any update
  const saveProjects = async (updatedProjects: any[]) => {
    try {
      await writeTextFile(PROJECTS_FILE, JSON.stringify(updatedProjects, null, 2), {
        baseDir: BaseDirectory.AppData,
      });
    } catch (error) {
      console.error("Failed to save project:", error);
      alert("Error saving project!");
    }
  };

  // Open project in Explorer
  const handleOpenInExplorer = async (path: string, name: string) => {
    await open(`file://${path}${name}`);
    alert(`Opening ${name} in Explorer...`);
  };

  // Open project in VSCode
  const handleOpenInVSCode = async (path: string, name: string) => {
    await open(`vscode://file/${path}/${name}`);
    alert(`Opening ${name} in VSCode...`);
  };

  // Toggle Pin project
  const togglePinProject = (projectName: string) => {
    const updatedProjects = projects.map((p) =>
      p.name === projectName ? { ...p, pinned: !p.pinned } : p
    );
    updatedProjects.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)); // Move pinned projects to top
    setProjects(updatedProjects);
    saveProjects(updatedProjects);
  };

  // Delete project
  const handleDeleteProject = async (project: any) => {
    const confirmed = confirm(`Are you sure you want to delete ${project.name}?`);
    if (!confirmed) return;

    const updatedProjects = projects.filter(p => p.name !== project.name);
    setProjects(updatedProjects);

    try {
      await writeTextFile(PROJECTS_FILE, JSON.stringify(updatedProjects, null, 2), {
        baseDir: BaseDirectory.AppData,
      });
      
      const projectPath = await join(project.path, project.name);
      await remove(projectPath, { recursive: true });
      alert("Project deleted successfully!");
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert(`Error deleting project: ${error}`);
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

                    <DropdownMenuItem onClick={() => handleOpenInExplorer(project.path, project.name)}>
                        <FolderOpen className="mr-2" />
                        Explorer
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleOpenInVSCode(project.path, project.name)}>
                        <i className="devicon-vscode-plain mr-2" />
                        Vs Code
                    </DropdownMenuItem> 
                                   
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          
        </DropdownMenuGroup>


        

        <DropdownMenuItem onClick={() => togglePinProject(project.name)}>
          <Pin className="mr-2" />
          {project.pinned ? 'Unpin' : 'Pin'}
        </DropdownMenuItem>
        <DropdownMenuItem >
          <Play className="mr-2"/>
          Start
        </DropdownMenuItem>
        <DropdownMenuItem >
        <i className="mr-2 devicon-npm-original-wordmark"></i>
          Npm
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
