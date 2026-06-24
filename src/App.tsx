import { useEffect, useState } from "react";
import type { Asset, Folder } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Grid } from "./components/Grid";
import { useLibrary } from "./hooks/useLibrary";
import { TagModal } from "./components/TagModal";
import { PreviewPanel } from "./components/PreviewPanel";

export default function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [refreshFolders, setRefreshFolders] = useState(0); // Trigger refresh
  const { handleBrowseFiles } = useLibrary();
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  // Load folders (including when refreshFolders changes)
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const folderList = await (window as any).electron.library.getFolders();
        setFolders(folderList);

        // If no folder selected, select the default "All Assets"
        if (!selectedFolderId && folderList.length > 0) {
          const defaultFolder = folderList.find(
            (f: any) => f.name === "All Assets",
          );
          if (defaultFolder) {
            setSelectedFolderId(defaultFolder.id);
          }
        }
      } catch (error) {
        console.error("Error loading folders:", error);
      }
    };

    loadFolders();
  }, [refreshFolders]);

  // Load assets when folder changes
  useEffect(() => {
    if (!selectedFolderId) return;

    const loadAssets = async () => {
      try {
        console.log("Loading assets for folder:", selectedFolderId);
        const dbAssets = await (window as any).electron.library.getAssets(
          selectedFolderId,
        );
        console.log("Loaded assets:", dbAssets);
        setAssets(dbAssets);
      } catch (error) {
        console.error("Error loading assets:", error);
      }
    };

    loadAssets();
  }, [selectedFolderId]);

  // Clean up missing assets on startup
  useEffect(() => {
    const cleanup = async () => {
      try {
        const deletedCount = await (
          window as any
        ).electron.library.cleanupMissingAssets();
        console.log(`Cleaned up ${deletedCount} missing assets`);
      } catch (error) {
        console.error("Error cleaning up assets:", error);
      }
    };

    cleanup();
  }, []);

  const handleFilesDropped = async (filePaths: string[]) => {
    if (!selectedFolderId) {
      alert("Please select a folder first");
      return;
    }

    console.log("Starting import of:", filePaths);
    setLoading(true);

    try {
      const importedAssets = await (
        window as any
      ).electron.library.importAssets(
        filePaths.map((filePath) => ({
          filePath,
          fileName: filePath.split("\\").pop(),
        })),
        selectedFolderId,
      );

      console.log("Imported assets from library:", importedAssets);
      setAssets((prev) => [...prev, ...importedAssets]);
    } catch (error) {
      console.error("Error importing assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = async () => {
    console.log("Import button clicked");
    const filesInfo = await handleBrowseFiles();
    console.log("Selected files:", filesInfo);

    if (filesInfo.length > 0) {
      await handleFilesDropped(filesInfo.map((f) => f.path));
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Please enter a folder name");
      return;
    }

    setCreatingFolder(true);
    try {
      const newFolder = await (window as any).electron.library.createFolder(
        newFolderName,
        selectedFolderId,
      );
      console.log("Created folder:", newFolder);
      setNewFolderName("");
      setShowCreateFolderModal(false);

      // Trigger folder list refresh
      setRefreshFolders((prev) => prev + 1);
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder: " + (error as Error).message);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await (window as any).electron.library.deleteFolder(folderId);
      console.log("Deleted folder");

      // Refresh folders and reset selection
      setRefreshFolders((prev) => prev + 1);
      setSelectedFolderId(null);
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("Failed to delete folder: " + (error as Error).message);
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await (window as any).electron.library.renameFolder(folderId, newName);
      console.log("Renamed folder to:", newName);

      // Refresh folders
      setRefreshFolders((prev) => prev + 1);
    } catch (error) {
      console.error("Error renaming folder:", error);
      alert("Failed to rename folder: " + (error as Error).message);
    }
  };

  const [tagModalAsset, setTagModalAsset] = useState<Asset | null>(null);

  const handleTagAsset = (asset: Asset) => {
    setTagModalAsset(asset);
  };

  const handleTagAdded = () => {
    // Reload assets to refresh tags display
    if (selectedFolderId) {
      const loadAssets = async () => {
        const dbAssets = await (window as any).electron.library.getAssets(
          selectedFolderId,
        );
        setAssets(dbAssets);
      };
      loadAssets();
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        folders={folders}
        onImport={handleImportClick}
        loading={loading}
        selectedFolderId={selectedFolderId}
        onFolderSelect={setSelectedFolderId}
        onCreateFolder={() => setShowCreateFolderModal(true)}
        onDeleteFolder={handleDeleteFolder}
        onRenameFolder={handleRenameFolder}
      />
      <Grid
        assets={assets}
        folders={folders}
        loading={loading}
        selectedFolderId={selectedFolderId}
        onFolderSelect={setSelectedFolderId}
        onFilesDropped={handleFilesDropped}
        onTagAsset={setPreviewAsset}
      />

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Create New Folder</h2>
            <input
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") setShowCreateFolderModal(false);
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition"
              >
                {creatingFolder ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {previewAsset && (
        <PreviewPanel
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
        />
      )}
    </div>
  );
}
