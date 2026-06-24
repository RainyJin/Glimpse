import { useState } from "react";
import type { Folder } from "../types";

interface SidebarProps {
  folders: Folder[];
  onImport: () => void;
  loading: boolean;
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
}

export function Sidebar({
  folders,
  onImport,
  loading,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{
    folderId: string;
    x: number;
    y: number;
  } | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");

  const handleContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    setContextMenu({ folderId, x: e.clientX - 256, y: e.clientY });
  };

  const handleRenameClick = (folder: Folder) => {
    setRenamingFolderId(folder.id);
    setRenamingName(folder.name);
    setContextMenu(null);
  };

  const handleRenameSubmit = (folderId: string) => {
    if (
      renamingName.trim() &&
      renamingName !== folders.find((f) => f.id === folderId)?.name
    ) {
      onRenameFolder(folderId, renamingName);
    }
    setRenamingFolderId(null);
    setRenamingName("");
  };

  const handleDeleteClick = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (
      folder &&
      confirm(
        `Are you sure you want to delete "${folder.name}"? This cannot be undone.`,
      )
    ) {
      onDeleteFolder(folderId);
    }
    setContextMenu(null);
  };

  return (
    <div className="w-64 bg-gray-900 text-white p-4 flex flex-col gap-4 border-r border-gray-700">
      {/* Header */}
      <div className="text-2xl font-bold">Glimpse</div>

      {/* Import Button */}
      <button
        onClick={onImport}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition"
      >
        {loading ? "⏳ Importing..." : "+ Import Files"}
      </button>

      {/* Create Folder Button */}
      <button
        onClick={onCreateFolder}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition text-sm"
      >
        + New Folder
      </button>

      {/* Folders Section */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase">
          Folders
        </h3>
        {folders.length === 0 ? (
          <div className="text-gray-500 text-sm">No folders</div>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => {
              const depth = folder.path.split("\\").length - 1;
              const indent = depth * 16;
              const isRenaming = renamingFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  onContextMenu={(e) => handleContextMenu(e, folder.id)}
                  onClick={() => {
                    if (!isRenaming) {
                      onFolderSelect(folder.id);
                    }
                  }}
                  style={{ paddingLeft: `${12 + indent}px` }}
                  className={`py-2 pr-3 rounded cursor-pointer transition relative group ${
                    selectedFolderId === folder.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {isRenaming ? (
                    <input
                      type="text"
                      value={renamingName}
                      onChange={(e) => setRenamingName(e.target.value)}
                      onBlur={() => handleRenameSubmit(folder.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameSubmit(folder.id);
                        } else if (e.key === "Escape") {
                          setRenamingFolderId(null);
                        }
                      }}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-full"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>📁 {folder.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContextMenu(e, folder.id);
                          }}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          ⋮
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg z-50 py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() =>
              handleRenameClick(
                folders.find((f) => f.id === contextMenu.folderId)!,
              )
            }
            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            ✏️ Rename
          </button>
          <button
            onClick={() => handleDeleteClick(contextMenu.folderId)}
            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* Tags Section (placeholder) */}
      <div>
        <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase">
          Tags
        </h3>
        <div className="text-gray-500 text-sm">Coming soon...</div>
      </div>
    </div>
  );
}
