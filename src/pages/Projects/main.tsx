"use client";
import { readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pin, Plus, Search } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import ProjectActions from "./projectsActions";
import ProjectDetails from "./projectDetails";
import { useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const Projects = () => {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<any | null>(
    null
  );
  const navigate = useNavigate();
  const [, setLastModified] = React.useState<Date | null>(null);
  const [, setFolderSize] = React.useState<string>("Calculating...");

  // Load projects from file on startup
  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await readTextFile("projects/projects.json", {
          baseDir: BaseDirectory.AppData,
        });
        setProjects(JSON.parse(data));
      } catch (error) {
        console.log("No projects found, initializing empty list.");
      }
    };
    loadProjects();
  }, []);

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    setLastModified(null); // Reset previous data
    setFolderSize("Calculating...");
  };

  const getProjectIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "angular":
        return <i className="devicon-angularjs-plain colored mr-2" />;
      case "react":
        return <i className="devicon-react-original colored mr-2" />;
      case "next":
        return <i className="devicon-nextjs-plain mr-2" />;
      default:
        return <i className="devicon-code-plain mr-2" />; // Default icon
    }
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

  const getFolderSize = async (path: string): Promise<string> => {
    try {
      const size = await invoke<number>("get_dir_size", { path });
      if (size < 1024) return `${size} B`;
      else if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
      else if (size < 1024 * 1024 * 1024)
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
      else return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } catch (error) {
      console.error("Error getting folder size:", error);
      return "Error calculating size";
    }
  };

  React.useEffect(() => {
    if (selectedProject) {
      getLastModifiedDate(selectedProject.path).then(setLastModified);
      getFolderSize(selectedProject.path).then(setFolderSize);
    }
  }, [selectedProject]);

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] p-6">
      <div className="flex h-full w-full p-6 ">
        {/* Left Sidebar: Project List */}
        <div className="w-1/4 max-w-xs border-r p-4 overflow-y-auto flex flex-col items-center justify-start">
          <h2 className="text-lg font-bold mb-4">Projects</h2>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add a Project
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem disabled onClick={() => navigate("/locate")}>
                <Search className="mr-2 h-4 w-4" />
                Locate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/nextjs")}>
                <i className="devicon-nextjs-plain mr-2"></i>
                Nextjs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/angular")}>
                <i className="devicon-angularjs-plain colored mr-2"></i>
                Angular
              </DropdownMenuItem>
              <DropdownMenuItem disabled onClick={() => navigate("/reactjs")}>
                <i className="devicon-react-plain colored mr-2"></i>
                ReactJs
              </DropdownMenuItem>
              <DropdownMenuItem disabled onClick={() => navigate("/vuejs")}>
                <i className="devicon-vuejs-plain colored mr-2"></i>
                VueJs
              </DropdownMenuItem>
              <DropdownMenuItem disabled onClick={() => navigate("/symfony")}>
                <i className="devicon-symfony-plain mr-2"></i>
                Symfony
              </DropdownMenuItem>
              <DropdownMenuItem disabled onClick={() => navigate("/laravel")}>
                <i className="devicon-laravel-plain colored mr-2"></i>
                Laravel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
                    {getProjectIcon(project.type)}
                    <span className="truncate">{project.name}</span>
                  </div>
                  {project.pinned && (
                    <Pin className="h-5 w-5 text-yellow-500 ml-2" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Panel: Project Details */}
        <div
          className="flex-1 p-6 overflow-y-auto"
          style={{
            minHeight: '300px', // Adjust this value as needed
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {selectedProject ? (
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex flex-row items-center">
                    {getProjectIcon(selectedProject.type)}
                    <h2
                      className="text-2xl font-bold truncate"
                      style={{ maxWidth: "250px" }}
                    >
                      {selectedProject.name.charAt(0).toUpperCase() +
                        selectedProject.name.slice(1)}
                    </h2>
                  </div>
                  <ProjectDetails
                    selectedProject={selectedProject}
                  />
                </div>
                <div className="flex justify-end items-center ml-auto ">
                  <ProjectActions
                    project={selectedProject}
                    projects={projects}
                    setProjects={setProjects}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center text-lg flex-grow flex items-center justify-center">
              🌟 Pick a project to explore its details!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;