import type { Folder } from "../types";

interface BreadcrumbProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string) => void;
}

export function Breadcrumb({
  folders,
  selectedFolderId,
  onFolderSelect,
}: BreadcrumbProps) {
  // Build breadcrumb path
  const buildPath = (folderId: string | null): Folder[] => {
    if (!folderId) return [];

    const path: Folder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = folders.find((f) => f.id === currentId);
      if (!folder) break;

      path.unshift(folder);
      currentId = folder.parentFolderId;
    }

    return path;
  };

  const path = buildPath(selectedFolderId);

  if (path.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      {path.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-2">
          <button
            onClick={() => onFolderSelect(folder.id)}
            className="text-blue-600 hover:text-blue-700 hover:underline transition"
          >
            {folder.name}
          </button>
          {index < path.length - 1 && <span className="text-gray-400">/</span>}
        </div>
      ))}
    </div>
  );
}
