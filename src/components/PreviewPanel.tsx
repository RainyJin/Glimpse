import { useState, useEffect } from "react";
import type { Asset } from "../types";

interface PreviewPanelProps {
  asset: Asset | null;
  onClose: () => void;
}

export function PreviewPanel({ asset, onClose }: PreviewPanelProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    if (!asset) return;

    const loadData = async () => {
      try {
        setLoadingTags(true);
        // Load thumbnail
        const thumbPath = await (window as any).electron.thumbnail.get(
          asset.path,
        );
        setThumbnail(thumbPath);

        // Load tags
        const [allTagsData, assetTagsData] = await Promise.all([
          (window as any).electron.library.getAllTags(),
          (window as any).electron.library.getAssetTags(asset.id),
        ]);
        setAllTags(allTagsData);
        setTags(assetTagsData);
      } catch (error) {
        console.error("Error loading preview data:", error);
      } finally {
        setLoadingTags(false);
      }
    };

    loadData();
  }, [asset]);

  if (!asset) return null;

  const handleToggleTag = async (tagId: string) => {
    try {
      const hasTag = tags.some((t) => t.id === tagId);
      if (hasTag) {
        await (window as any).electron.library.removeTagFromAsset(
          asset.id,
          tagId,
        );
        setTags((prev) => prev.filter((t) => t.id !== tagId));
      } else {
        await (window as any).electron.library.addTagToAsset(asset.id, tagId);
        const tag = allTags.find((t) => t.id === tagId);
        if (tag) {
          setTags((prev) => [...prev, tag]);
        }
      }
    } catch (error) {
      console.error("Error toggling tag:", error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setCreatingTag(true);
    try {
      const newTag = await (window as any).electron.library.createTag(
        newTagName,
      );
      setAllTags((prev) => [...prev, newTag]);
      setNewTagName("");
    } catch (error) {
      console.error("Error creating tag:", error);
      alert("Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40">
      {/* Side Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-lg flex flex-col">
        {/* Close button */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Asset Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Preview Image */}
          {thumbnail && (
            <div className="mb-6">
              <img
                src={thumbnail}
                alt={asset.name}
                className="w-full h-auto rounded border"
              />
            </div>
          )}

          {/* Asset Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-mono text-xs text-gray-900 break-all">
                  {asset.name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <p className="text-gray-900">{asset.type}</p>
              </div>
              <div>
                <span className="text-gray-600">Size:</span>
                <p className="text-gray-900">
                  {formatFileSize(asset.fileSize)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Added:</span>
                <p className="text-gray-900">{formatDate(asset.dateAdded)}</p>
              </div>
              <div>
                <span className="text-gray-600">Path:</span>
                <p className="font-mono text-xs text-gray-900 break-all">
                  {asset.path}
                </p>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Tags</h3>

            {/* Create Tag */}
            <div className="mb-4 pb-4 border-b">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New tag..."
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
                  +
                </button>
              </div>
            </div>

            {/* Tags List */}
            {loadingTags ? (
              <div className="text-center text-gray-500 text-sm">
                Loading tags...
              </div>
            ) : allTags.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                No tags yet
              </div>
            ) : (
              <div className="space-y-2">
                {allTags.map((tag) => {
                  const isSelected = tags.some((t) => t.id === tag.id);
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
        </div>

        {/* Quick Actions */}
        <div className="border-t p-4 space-y-2">
          <button className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition">
            📁 Open in Explorer
          </button>
          <button className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition">
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}
