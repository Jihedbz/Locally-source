"use client";
import { join } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, BaseDirectory, remove, readDir, stat } from "@tauri-apps/plugin-fs";
import AddProjectDialog from "./addProjectDialog";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Code, Trash2, FolderOpen, Pin } from "lucide-react";
const { open, Command } = await import("@tauri-apps/plugin-shell");
import { invoke } from "@tauri-apps/api/core";

const PROJECTS_FILE = "projects/projects.json";

const Projects = () => {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<any | null>(null);

  // Load projects from file on startup
  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await readTextFile(PROJECTS_FILE, {
          baseDir: BaseDirectory.AppData,
        });
        setProjects(JSON.parse(data));
      } catch (error) {
        console.log("No projects found, initializing empty list.");
      }
    };
    loadProjects();
  }, []);

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

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
  };

  const handleAddProject = async (newProject: any) => {
    const updatedProjects = [...projects, { ...newProject, pinned: false }];
    setProjects(updatedProjects);
    saveProjects(updatedProjects);
  };

  const handleDeleteProject = async (project: any) => {
    const confirmed = confirm(`Are you sure you want to delete ${project.name}?`);
    if (!confirmed) return;

    const updatedProjects = projects.filter(p => p.name !== project.name);
    setProjects(updatedProjects);
    setSelectedProject(null);

    try {
      await writeTextFile(PROJECTS_FILE, JSON.stringify(updatedProjects, null, 2), {
        baseDir: BaseDirectory.AppData,
      });
      
      // Use Tauri's path join to handle paths properly
      const projectPath = await join(project.path, project.name);
      
      await remove(projectPath, { recursive: true });
      alert("Project deleted successfully!");
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert(`Error deleting project: ${error}`);
    }
  };

    const togglePinProject = (projectName: string) => {
    const updatedProjects = projects.map((project) =>
      project.name === projectName ? { ...project, pinned: !project.pinned } : project
    );
    updatedProjects.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)); // Move pinned projects to top
    setProjects(updatedProjects);
    saveProjects(updatedProjects);
  };

  const getProjectIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "angular":
        return <i className="devicon-angularjs-plain colored mr-2" />;
      case "react":
        return <i className="devicon-react-original colored mr-2" />;
      default:
        return <i className="devicon-code-plain mr-2" />; // Default icon
    }
  };

  const handleOpenInExplorer = async (path: string, name: string) => {
    await open(`file://${path}${name}`);
  };

  const handleOpenInVSCode = async (path: string, name: string) => {
    await open(`vscode://file/${path}${name}`);
  };


  const getLastModifiedDate = async (dirPath: string) => {
    try {
      const timestamp = await invoke<number>("get_last_modified", { dirPath });
      return timestamp ? new Date(timestamp * 1000) : null;
    } catch (error) {
      console.error("Error fetching last modified date:", error);
      return null;
    }
  };
  
  const [lastModified, setLastModified] = React.useState<Date | null>(null);
  const [folderSize, setFolderSize] = React.useState<string>("Calculating...");
 
  React.useEffect(() => {
    if (selectedProject) {
      getLastModifiedDate(selectedProject.path).then(setLastModified);
    }
  }, [selectedProject]);
  
  React.useEffect(() => {
    if (selectedProject) {
      invoke<number>("get_folder_size", { path: selectedProject.path })
        .then((size) => {
          if (size < 1024) setFolderSize(`${size} B`);
          else if (size < 1024 * 1024) setFolderSize(`${(size / 1024).toFixed(2)} KB`);
          else if (size < 1024 * 1024 * 1024) setFolderSize(`${(size / (1024 * 1024)).toFixed(2)} MB`);
          else setFolderSize(`${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`);
        })
        .catch((err) => console.error("Error getting folder size:", err));
    }
  }, [selectedProject]);
  
  


  




























  return (
<div className="flex h-full w-full p-6">
  {/* Left Sidebar: Project List */}
  <div className="w-1/4 max-w-xs border-r p-4 overflow-y-auto flex flex-col items-center justify-center">
    <h2 className="text-lg font-bold mb-4">Projects</h2>
    <AddProjectDialog onAddProject={handleAddProject} />
    <Separator className="my-5" />
      <ul>
        {projects.map((project) => (
          <li key={project.name} className="mb-2 relative">
            <Button
              variant="ghost"
              className="text-left w-full flex items-center justify-between"
              onClick={() => handleProjectClick(project)}
            >
              <div className="flex items-center w-full">
                <div className="w-8 flex justify-center">
                  {getProjectIcon(project.type)}
                </div>
                <span className="truncate">{project.name} 
                </span>
              </div>
              {project.pinned && <Pin className="h-5 w-5 text-yellow-500 ml-2" />}

            </Button>
            
          </li>
        ))}
      </ul>

  </div>

  {/* Right Panel: Project Details */}
  <div className="flex-1 p-6 overflow-y-auto">
    {selectedProject ? (
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex flex-row">
              <div className="basis-1/3">
              <h2 className="text-2xl font-bold truncate underline" style={{ width: '250px' }}>
                {selectedProject.name.replace(/^[a-z]/, (char: string) => char.toUpperCase())}
              </h2>

              </div>
              <div className="basis-2/3 flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleOpenInExplorer(selectedProject.path, selectedProject.name)}
                >
                  <FolderOpen className="" />
                  Open in Explorer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenInVSCode(selectedProject.path, selectedProject.name)}
                >
                  <i className="devicon-vscode-plain colored"></i>
                  Open in VS Code
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => togglePinProject(selectedProject.name)}
                  
                >
                  <Pin className="h-5 w-5 text-gold-400"/>
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteProject(selectedProject)}
                >
                  <Trash2/>
                </Button>
                
              </div>
            </div>
            <div className="mt-2">
              <p className="text-gray-600 font-bold mb-1">General Information</p>
              <div className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-1 items-center">
                <p className="text-gray-600 font-medium">Type:</p>
                <p className="text-gray-600">{selectedProject.type}</p>

                <p className="text-gray-600 font-medium">Path:</p>
                <p className="text-gray-600 truncate">{selectedProject.path}</p>

                <p className="text-gray-600 font-medium">Created At:</p>
                <p className="text-gray-600">{new Date(selectedProject.createdAt).toLocaleString()}</p>

                <p className="text-gray-600 font-medium">Last Modified:</p>
                <p className="text-gray-600">{lastModified ? lastModified.toLocaleString() : "N/A"}</p>

                <p className="text-gray-600 font-medium">Size:</p>
                <p className="text-gray-600">{folderSize ? folderSize : "N/A"}</p>

              </div>
            </div>


          </div>
        </div>
      </div>
    ) : (
      <div className="text-gray-500 text-center text-lg">
        Select a project to see details
      </div>
    )}
  </div>
</div>

  );
};

export default Projects;
