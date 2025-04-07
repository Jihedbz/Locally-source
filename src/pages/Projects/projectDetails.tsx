import * as React from "react";
import { invoke } from "@tauri-apps/api/core";

interface ProjectDetailsProps {
  selectedProject: any;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ selectedProject }) => {
  const [lastModified, setLastModified] = React.useState<Date | null>(null);
  const [folderSize, setFolderSize] = React.useState<string>("Calculating...");

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

  // Function to get folder size
  const getFolderSize = async (path: string) => {
    try {
      const size = await invoke<number>("get_folder_size", { path });
      if (size < 1024) setFolderSize(`${size} B`);
      else if (size < 1024 * 1024) setFolderSize(`${(size / 1024).toFixed(2)} KB`);
      else if (size < 1024 * 1024 * 1024) setFolderSize(`${(size / (1024 * 1024)).toFixed(2)} MB`);
      else setFolderSize(`${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    } catch (err) {
      console.error("Error getting folder size:", err);
    }
  };

  React.useEffect(() => {
    if (selectedProject) {
      getLastModifiedDate(selectedProject.path).then(setLastModified);
      getFolderSize(selectedProject.path);
    }
  }, [selectedProject]);

  return (
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
  );
};

export default ProjectDetails;
