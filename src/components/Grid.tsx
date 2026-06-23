import type { Asset } from "../types";

interface GridProps {
  assets: Asset[];
  loading: boolean;
  onFilesDropped: (files: string[]) => Promise<void>;
}

export function Grid({ assets, loading, onFilesDropped }: GridProps) {
  return (
    <div className="flex-1 p-6 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Assets ({assets.length})</h1>
        <input
          type="text"
          placeholder="Search..."
          className="px-4 py-2 rounded bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Grid Container */}
      <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 transition">
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-gray-100 rounded overflow-hidden cursor-pointer hover:shadow-lg transition h-40 flex items-center justify-center flex-col gap-2 p-2 border border-gray-200"
              >
                <div className="text-4xl">
                  {asset.type === "image" ? "🖼️" : "📄"}
                </div>
                <span className="text-xs text-gray-700 truncate w-full text-center font-medium">
                  {asset.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
