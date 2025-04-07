import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { writeTextFile, readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
// UI Components
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


interface Project {
  name: string;
  path: string;
  type: string;
}

export function AddAngularProjectDialog({ onAddProject }: { onAddProject: (project: Project) => void }) { const [form, setForm] = useState({ name: "", type: "" }); // Removed path from state
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);

  
  const handleChange = (name: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name) {
      setAlert({ type: "error", message: "All fields are required." });
      return;
    }
  
    try {
      // Get the AppData directory
      const appDataDirPath = await appDataDir();
      
      // Construct the full project path
      const projectPath = `${appDataDirPath}\\projects\\`;
      const now = new Date().toISOString();


    
      // Pass the full path to the backend
      await invoke("create_angular_project", {
        name: form.name
      });
    
      const newProject = { 
        name: form.name, 
        path: projectPath,  // Store the full path
        type: "Angular",
        createdAt: now 
      };

      await saveProject(newProject);
      onAddProject(newProject);
      setAlert({ type: "success", message: "Project created successfully in AppData/projects." });
      setForm({ name: "", type: "" });
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", message: `Failed to create project: ${error}` });
    }
  };

  //save the project info in the JSON file
    const saveProject = async (project: Project) => {
    try {
      const filePath = 'projects/projects.json'; // Save in AppData root
      let projects: Project[] = [];
  
      try {
        const data = await readTextFile(filePath, { baseDir: BaseDirectory.AppData });
        projects = JSON.parse(data);
      } catch (error) {
        if (!(error instanceof Error && error.message.includes("File not found"))) {
          throw error; // Only ignore 'File not found' errors
        }
      }
  
      projects.push(project);
      await writeTextFile(filePath, JSON.stringify(projects, null, 2), {
        baseDir: BaseDirectory.AppData,
        create: true,
      });
    } catch (error) {
      throw error;
    }
  };
  

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);


  return (
    <Dialog>




      <DialogTrigger asChild>

        <Button variant="ghost" className="mr-2">
          <i className="devicon-angularjs-plain colored mr-2 items-center" />
          Angular
        </Button>

      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Angular Project</DialogTitle>
          <DialogDescription>
            Enter details and deploy your project.
            <br />
            Project will be deployed without installed dependencies.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectName" className="text-right">
                Name
              </Label>
              <Input
                className="col-span-3"
                id="projectName"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>


            
            

          </div>

          <DialogFooter>
            <Button type="submit">Deploy 🚀</Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {alert && (
        <div
          className={`z-[1000] fixed bottom-6 right-6 p-4 rounded-md w-72 transition-opacity duration-5000 ease-in-out`}
        >
          <Alert variant={alert.type === "success" ? "default" : "destructive"}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alert.type === "success" ? "Success!" : "Error"}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        </div>
      )}
    </Dialog>
  );
}

export default AddAngularProjectDialog;
