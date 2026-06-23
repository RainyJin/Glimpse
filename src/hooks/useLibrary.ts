import { useState, useCallback } from "react";

export function useLibrary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback(async (filePaths: string[]) => {
    setLoading(true);
    setError(null);

    try {
      console.log("handleFilesSelected called with:", filePaths);

      // Get file info for each file
      const filesInfo = await Promise.all(
        filePaths.map(async (filePath) => {
          console.log("Getting file info for:", filePath);
          const fileInfo = await (window as any).electron.fs.getFileInfo(
            filePath,
          );
          console.log("File info result:", fileInfo);
          return fileInfo;
        }),
      );

      console.log("All files info:", filesInfo);

      // Filter out directories, keep only files
      const validFiles = filesInfo.filter((f) => f && f.isFile);

      if (validFiles.length === 0) {
        setError("No valid files selected");
        return [];
      }

      return validFiles;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error in handleFilesSelected:", errorMsg);
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBrowseFiles = useCallback(async () => {
    console.log("handleBrowseFiles called");
    try {
      console.log("Calling electron.dialog.openFile()");
      const filePaths = await (window as any).electron.dialog.openFile();
      console.log("Dialog returned filePaths:", filePaths);

      if (filePaths && filePaths.length > 0) {
        console.log("Processing files...");
        return await handleFilesSelected(filePaths);
      } else {
        console.log("No files selected in dialog");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error in handleBrowseFiles:", errorMsg);
      setError(errorMsg);
    }
    return [];
  }, [handleFilesSelected]);

  return {
    loading,
    error,
    handleFilesSelected,
    handleBrowseFiles,
  };
}
