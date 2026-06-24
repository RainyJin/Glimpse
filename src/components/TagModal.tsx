import { useEffect, useState } from "react";
import type { Asset } from "../types";

interface TagModalProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
  onTagAdded: () => void;
}

export function TagModal({
  asset,
  isOpen,
  onClose,
  onTagAdded,
}: TagModalProps) {
  const [allTags, setAllTags] = useState<any[]>([]);
  const [assetTags, setAssetTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState<string>("");
  const [loadingTags, setLoadingTags] = useState<boolean>(true);
  const [creatingTag, setCreatingTag] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadTags = async () => {
      try {
        const [all, assetTagsData] = await Promise.all([
          (window as any).electron.library.getAllTags(),
          (window as any).electron.library.getAssetTags(asset.id),
        ]);
        setAllTags(all);
        setAssetTags(assetTagsData);
      } catch (error) {
        console.error("Error loading tags:", error);
      } finally {
        setLoadingTags(false);
      }
    };

    loadTags();
  }, [isOpen, asset.id]);

  const handleToggleTag = async (tagId: string): Promise<void> => {
    try {
      const hasTag = assetTags.some((t: any) => t.id === tagId);
      if (hasTag) {
        await (window as any).electron.library.removeTagFromAsset(
          asset.id,
          tagId,
        );
        setAssetTags((prev: any[]) => prev.filter((t) => t.id !== tagId));
      } else {
        await (window as any).electron.library.addTagToAsset(asset.id, tagId);
        const tag = allTags.find((t: any) => t.id === tagId);
        if (tag) {
          setAssetTags((prev: any[]) => [...prev, tag]);
        }
      }
      onTagAdded();
    } catch (error) {
      console.error("Error toggling tag:", error);
    }
  };

  const handleCreateTag = async (): Promise<void> => {
    if (!newTagName.trim()) return;

    setCreatingTag(true);
    try {
      const newTag = await (window as any).electron.library.createTag(
        newTagName,
      );
      setAllTags((prev: any[]) => [...prev, newTag]);
      setNewTagName("");
    } catch (error) {
      console.error("Error creating tag:", error);
      alert("Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg max-h-96 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Tag Asset</h2>

        {/* Asset name */}
        <p className="text-sm text-gray-600 mb-4">{asset.name}</p>

        {/* Create new tag */}
        <div className="mb-4 pb-4 border-b">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateTag();
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateTag}
              disabled={creatingTag || !newTagName.trim()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm transition"
            >
              {creatingTag ? "..." : "+"}
            </button>
          </div>
        </div>

        {/* Tags list */}
        <div className="flex-1 overflow-y-auto mb-4">
          {loadingTags ? (
            <div className="text-center text-gray-500 py-4">
              Loading tags...
            </div>
          ) : allTags.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No tags yet</div>
          ) : (
            <div className="space-y-2">
              {allTags.map((tag: any) => {
                const isSelected = assetTags.some((t: any) => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className={`w-full px-3 py-2 rounded text-sm transition text-left flex items-center gap-2 ${
                      isSelected
                        ? "bg-blue-100 text-blue-900 border border-blue-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    {isSelected && <span className="ml-auto">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}
