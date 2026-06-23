const esbuild = require("esbuild");
const fs = require("fs");

// Ensure dist-electron folder exists
if (!fs.existsSync("dist-electron")) {
  fs.mkdirSync("dist-electron", { recursive: true });
}

// Build main.ts (ESM)
esbuild.buildSync({
  entryPoints: ["src/electron/main.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm", // ← ESM for main
  outdir: "dist-electron",
  external: ["electron", "fs-extra", "better-sqlite3", "chokidar"],
  loader: { ".ts": "ts" },
});

// Build preload.ts (CommonJS)
esbuild.buildSync({
  entryPoints: ["src/electron/preload.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs", // ← CJS for preload
  outdir: "dist-electron",
  outExtension: { ".js": ".cjs" }, // ← Name it .cjs
  external: ["electron"],
  loader: { ".ts": "ts" },
});

console.log("✅ Electron files compiled");
