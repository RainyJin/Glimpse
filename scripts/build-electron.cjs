const esbuild = require("esbuild");
const fs = require("fs");

// Clean dist-electron folder first
if (fs.existsSync("dist-electron")) {
  fs.rmSync("dist-electron", { recursive: true, force: true });
}

fs.mkdirSync("dist-electron", { recursive: true });

// Build main.ts
esbuild.buildSync({
  entryPoints: ["src/electron/main.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outdir: "dist-electron",
  external: [
    "electron",
    "fs-extra",
    "sqlite3",
    "sharp",
    "better-sqlite3",
    "chokidar",
  ],
  loader: {
    ".ts": "ts",
  },
});

// Build preload.ts as CommonJS
esbuild.buildSync({
  entryPoints: ["src/electron/preload.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outdir: "dist-electron",
  outExtension: {
    ".js": ".cjs",
  },
  external: ["electron"],
  loader: {
    ".ts": "ts",
  },
});

console.log("✅ Electron files compiled");
