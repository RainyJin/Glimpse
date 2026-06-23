interface SidebarProps {
  onImport: () => void;
  loading: boolean;
}

export function Sidebar({ onImport, loading }: SidebarProps) {
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

      {/* Folders Section */}
      <div>
        <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase">
          Folders
        </h3>
        <div className="space-y-1">
          <div className="px-3 py-2 rounded bg-blue-600 text-white cursor-pointer">
            All Assets
          </div>
          <div className="px-3 py-2 rounded text-gray-300 hover:bg-gray-800 cursor-pointer">
            Recent
          </div>
          <div className="px-3 py-2 rounded text-gray-300 hover:bg-gray-800 cursor-pointer">
            Favorites
          </div>
        </div>
      </div>

      {/* Tags Section (placeholder) */}
      <div>
        <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase">
          Tags
        </h3>
        <div className="text-gray-500 text-sm">No tags yet</div>
      </div>
    </div>
  );
}
