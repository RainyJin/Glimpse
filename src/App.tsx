import { useEffect, useState } from "react";
import type { Asset } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Grid } from "./components/Grid";
import { useLibrary } from "./hooks/useLibrary";

export default function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const { loading, handleBrowseFiles } = useLibrary();

  const handleFilesDropped = async (filePaths: string[]) => {
    console.log("Starting import of:", filePaths);
    // This will be used later when we integrate with the file system
  };

  const handleImportClick = async () => {
    console.log("Import button clicked");
    const filesInfo = await handleBrowseFiles();
    console.log("Selected files:", filesInfo);

    if (filesInfo.length > 0) {
      const newAssets = filesInfo.map((file) => ({
        id: Math.random().toString(36),
        name: file.name,
        path: file.path,
        type: getFileType(file.name),
        folderId: "root",
        dateAdded: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        fileSize: file.size,
      }));

      console.log("New assets:", newAssets);
      setAssets((prev) => [...prev, ...newAssets]);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar onImport={handleImportClick} loading={loading} />
      <Grid
        assets={assets}
        loading={loading}
        onFilesDropped={handleFilesDropped}
      />
    </div>
  );
}

function getFileType(
  fileName: string,
): "image" | "video" | "document" | "file" {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const videoExts = ["mp4", "mov", "avi", "mkv"];
  const docExts = ["pdf", "doc", "docx", "txt"];

  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (docExts.includes(ext)) return "document";
  return "file";
}
