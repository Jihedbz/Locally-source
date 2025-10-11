import * as React from "react";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path"; // Import 'join'
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import {Clipboard} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectDetailsProps {
  selectedProject: any;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ selectedProject }) => {
  const [lastModified, setLastModified] = React.useState<Date | null>(null);
  const [folderSize, setFolderSize] = React.useState<string>("Calculating...");
  const [shortenedPath, setShortenedPath] = React.useState<string>(""); // New state for the short path

  // Function to get last modified date
  const getLastModifiedDate = async (dirPath: string) => {
    try {
      const timestamp = await invoke<number>("get_last_modified", { dirPath });
      return timestamp ? new Date(timestamp * 1000) : null;
    } catch (error) {
      console.error("Error fetching last modified date:", error);
      return null;
    }
  };

  const copyPathClipboard = async (path: string) => {
    try {
      await writeText(path);
      console.log("Path copied to clipboard:", path);
    } catch (error) {
      console.error("Error copying path to clipboard:", error);
    }
  }

  // Function to get folder size
  const getFolderSize = async (path: string): Promise<string> => {
    try {
      const size = await invoke<number>("get_dir_size", { path });
      return size ? `${(size / (1024 * 1024)).toFixed(2)} MB` : "0 MB";
    } catch (error) {
      console.error("Error fetching folder size:", error);
      return "Error calculating size";
    }
  };

  React.useEffect(() => {
    if (selectedProject) {
      getLastModifiedDate(selectedProject.path).then(setLastModified);
      getFolderSize(selectedProject.path).then((size) => setFolderSize(size));

      const shortenPath = async (fullPath: string) => {
        try {
          const appDataDirPath = await appDataDir();
          const projectsDirPath = await join(appDataDirPath, "projects");

          // Normalize paths to use forward slashes for comparison
          const normalizedFullPath = fullPath.replace(/\\/g, "/");
          const normalizedProjectsDirPath = projectsDirPath.replace(/\\/g, "/");

          if (normalizedFullPath.startsWith(normalizedProjectsDirPath)) {
            const relativePath = normalizedFullPath.substring(
              normalizedProjectsDirPath.length
            );
            setShortenedPath(`/projects${relativePath}`);
          } else {
            setShortenedPath(fullPath);
          }
        } catch (error) {
          console.error("Error shortening path:", error);
          setShortenedPath(fullPath);
        }
      };

      shortenPath(selectedProject.path);
    } else {
      setShortenedPath("");
    }
  }, [selectedProject]);

  return (
    <div className="mt-2">
      <p className="text-gray-600 font-bold mb-1">General Information</p>
      <div className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-1 items-center">
        <p className="text-gray-600 font-medium">Type:</p>
        <p className="text-gray-600">{selectedProject.type}</p>


        <p className="text-gray-600 font-medium">Path:</p>
        <div className="flex items-center space-x-2">
          <p className="text-gray-600 truncate">{shortenedPath}</p>
          <Button
              variant="outline"
              onClick={() => copyPathClipboard(selectedProject.path)}
          >
            <Clipboard className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-gray-600 font-medium">Created At:</p>
        <p className="text-gray-600">
          {new Date(selectedProject.createdAt).toLocaleString()}
        </p>

        <p className="text-gray-600 font-medium">Last Modified:</p>
        <p className="text-gray-600">
          {lastModified ? lastModified.toLocaleString() : "N/A"}
        </p>

        <p className="text-gray-600 font-medium">Size:</p>
        <p className="text-gray-600">{folderSize ? folderSize : "N/A"}</p>
      </div>
    </div>
  );
};

export default ProjectDetails;
