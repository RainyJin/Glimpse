import { useEffect, useState } from "react";
import type { Asset, Folder } from "../types";
import { Breadcrumb } from "./Breadcrumb";

interface GridProps {
  assets: Asset[];
  folders: Folder[];
  loading: boolean;
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string) => void;
  onFilesDropped: (files: string[]) => Promise<void>;
  onTagAsset?: (asset: Asset) => void;
}

export function Grid({
  assets,
  folders,
  loading,
  selectedFolderId,
  onFolderSelect,
  onFilesDropped,
  onTagAsset,
}: GridProps) {
  return (
    <div className="flex-1 p-6 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">All Assets ({assets.length})</h1>
        <input
          type="text"
          placeholder="Search..."
          className="px-4 py-2 rounded bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Breadcrumb */}
      <Breadcrumb
        folders={folders}
        selectedFolderId={selectedFolderId}
        onFolderSelect={onFolderSelect}
      />

      {/* Grid Container */}
      <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
              <p className="mt-2 text-gray-600">Importing files...</p>
            </div>
          </div>
        )}

        {!loading && assets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-lg">No assets yet</p>
            <p className="text-sm">Click the Import button to add files</p>
          </div>
        )}

        {!loading && assets.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 auto-rows-max">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onTagClick={onTagAsset || (() => {})}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual asset card with thumbnail
 */
function AssetCard({
  asset,
  onTagClick,
}: {
  asset: Asset;
  onTagClick: (asset: Asset) => void;
}) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading thumbnail for:", asset.path);
        const thumbPath = await (window as any).electron.thumbnail.get(
          asset.path,
        );

        if (!thumbPath) {
          setError("No thumbnail");
          console.warn("No thumbnail returned");
        } else if (
          !thumbPath.startsWith("data:image") &&
          !thumbPath.startsWith("file://")
        ) {
          setError("Invalid format");
          console.warn("Invalid thumbnail format:", thumbPath.substring(0, 50));
        } else {
          console.log("Valid thumbnail loaded:", thumbPath.substring(0, 50));
          setThumbnail(thumbPath);
        }

        const assetTags = await (window as any).electron.library.getAssetTags(
          asset.id,
        );
        setTags(assetTags);
      } catch (err) {
        console.error("Error loading data for", asset.name, ":", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [asset.path, asset.id]);

  return (
    <div className="relative group">
      <div className="bg-gray-100 rounded overflow-hidden cursor-pointer hover:shadow-lg transition h-40 relative border border-gray-200">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-400 border-t-blue-600 rounded-full"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-xs text-red-600">
              <div className="text-2xl">⚠️</div>
              <div>{error}</div>
            </div>
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={asset.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onLoad={() => console.log("Image displayed:", asset.name)}
            onError={(e) => {
              console.error("Image display error for", asset.name, ":", e);
              setError("Display error");
              setThumbnail(null);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl">
              {asset.type === "image"
                ? "🖼️"
                : asset.type === "video"
                  ? "🎬"
                  : "📄"}
            </div>
            <span className="text-xs text-gray-700 truncate w-full text-center font-medium">
              {asset.name}
            </span>
          </div>
        )}
      </div>

      {/* Overlay with tag button */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded transition flex items-center justify-center">
        <button
          onClick={() => {
            console.log("Preview clicked for:", asset.name);
            onTagClick(asset);
          }}
          className="opacity-0 group-hover:opacity-100 transition bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
        >
          👁️ View
        </button>
      </div>
    </div>
  );
}
