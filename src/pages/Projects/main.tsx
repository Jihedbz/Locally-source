"use client"; // Indicates usage in a client-side React environment

// Tauri's file system API for reading the projects file
import { readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import * as React from "react";

// UI components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pin, Plus, Search } from "lucide-react";
// Used to call Rust backend commands
import ProjectActions from "./projectsActions"; // Custom component for project-related actions (delete, pin, etc.)
import ProjectDetails from "./projectDetails"; // Custom component to display project info
import { useNavigate } from "react-router-dom"; // React Router for navigation

// Dropdown UI
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const Projects = () => {
  const [projects, setProjects] = React.useState<any[]>([]); // List of all projects
  const [selectedProject, setSelectedProject] = React.useState<any | null>(
    null
  ); // Currently selected project
  const navigate = useNavigate();

  // Load saved projects from the AppData directory on mount
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

  // Handle selection of a project from the sidebar
  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
  };

  // Return a matching icon based on project type
  const getProjectIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "angular":
        return <i className="devicon-angularjs-plain colored mr-2" />;
      case "react":
        return <i className="devicon-react-original colored mr-2" />;
      case "next":
        return <i className="devicon-nextjs-plain mr-2" />;
      default:
        return <i className="devicon-code-plain mr-2" />;
    }
  };






  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] p-6">
      <div className="flex h-full w-full p-6 ">
        {/* Sidebar: Project list + Add project menu */}
        <div className="w-1/4 max-w-xs border-r p-4 overflow-y-auto flex flex-col items-center justify-start">
          <h2 className="text-lg font-bold mb-4">Projects</h2>

          {/* Add Project dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add a Project
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {/* Different project types; some disabled for now */}
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

          {/* Render the project list */}
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

        {/* Main Panel: Project Details */}
        <div
          className="flex-1 p-6 overflow-y-auto"
          style={{
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {selectedProject ? (
            <div>
              {/* Project Header */}
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
                  <ProjectDetails selectedProject={selectedProject} />
                </div>

                {/* Action buttons (e.g., delete/pin) */}
                <div className="flex justify-end items-center ml-auto">
                  <ProjectActions
                    project={selectedProject}
                    projects={projects}
                    setProjects={setProjects}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Empty state when no project is selected
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
