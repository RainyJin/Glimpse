var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/uuid/dist-node/stringify.js
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
var byteToHex;
var init_stringify = __esm({
  "node_modules/uuid/dist-node/stringify.js"() {
    byteToHex = [];
    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 256).toString(16).slice(1));
    }
  }
});

// node_modules/uuid/dist-node/rng.js
function rng() {
  return crypto.getRandomValues(rnds8);
}
var rnds8;
var init_rng = __esm({
  "node_modules/uuid/dist-node/rng.js"() {
    rnds8 = new Uint8Array(16);
  }
});

// node_modules/uuid/dist-node/v4.js
function v4(options, buf, offset) {
  if (!buf && !options && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return _v4(options, buf, offset);
}
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default;
var init_v4 = __esm({
  "node_modules/uuid/dist-node/v4.js"() {
    init_rng();
    init_stringify();
    v4_default = v4;
  }
});

// node_modules/uuid/dist-node/index.js
var init_dist_node = __esm({
  "node_modules/uuid/dist-node/index.js"() {
    init_v4();
  }
});

// src/services/libraryManager.ts
var libraryManager_exports = {};
__export(libraryManager_exports, {
  addTagToAsset: () => addTagToAsset,
  cleanupMissingAssets: () => cleanupMissingAssets,
  closeLibrary: () => closeLibrary,
  createFolder: () => createFolder,
  createTag: () => createTag,
  deleteFolder: () => deleteFolder,
  deleteTag: () => deleteTag,
  getAllTags: () => getAllTags,
  getAssetTags: () => getAssetTags,
  getAssetsByFolder: () => getAssetsByFolder,
  getDb: () => getDb,
  getDefaultFolderId: () => getDefaultFolderId,
  getFolders: () => getFolders,
  getLibraryPath: () => getLibraryPath,
  importAssets: () => importAssets,
  initializeLibrary: () => initializeLibrary,
  removeTagFromAsset: () => removeTagFromAsset,
  renameFolder: () => renameFolder
});
import path from "path";
import os from "os";
import fs from "fs-extra";
import sqlite3 from "sqlite3";
async function initializeLibrary() {
  return new Promise((resolve) => {
    try {
      fs.ensureDirSync(LIBRARY_PATH);
      fs.ensureDirSync(GLIMPSE_DIR);
      fs.ensureDirSync(THUMBNAILS_DIR);
      db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error("\u274C Failed to initialize database:", err);
          resolve({
            success: false,
            error: err.message
          });
          return;
        }
        db.serialize(() => {
          db.run(`
            CREATE TABLE IF NOT EXISTS folders (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              path TEXT NOT NULL UNIQUE,
              parentFolderId TEXT,
              dateCreated TEXT NOT NULL,
              FOREIGN KEY(parentFolderId) REFERENCES folders(id)
            )
          `);
          db.run(`
            CREATE TABLE IF NOT EXISTS assets (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              path TEXT NOT NULL UNIQUE,
              type TEXT NOT NULL,
              folderId TEXT NOT NULL,
              dateAdded TEXT NOT NULL,
              dateModified TEXT NOT NULL,
              fileSize INTEGER,
              FOREIGN KEY(folderId) REFERENCES folders(id)
            )
          `);
          db.run(`
            CREATE TABLE IF NOT EXISTS tags (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              color TEXT,
              dateCreated TEXT NOT NULL
            )
          `);
          db.run(`
            CREATE TABLE IF NOT EXISTS asset_tags (
              assetId TEXT NOT NULL,
              tagId TEXT NOT NULL,
              PRIMARY KEY(assetId, tagId),
              FOREIGN KEY(assetId) REFERENCES assets(id),
              FOREIGN KEY(tagId) REFERENCES tags(id)
            )
          `);
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_assets_folderId ON assets(folderId)`
          );
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_folders_parentId ON folders(parentFolderId)`
          );
          db.get(
            "SELECT id FROM folders WHERE name = 'All Assets'",
            (err2, row) => {
              if (!row) {
                const folderId = v4_default();
                const folderPath = "All Assets";
                fs.ensureDirSync(path.join(LIBRARY_PATH, folderPath));
                db.run(
                  `INSERT INTO folders (id, name, path, parentFolderId, dateCreated)
                VALUES (?, ?, ?, NULL, ?)`,
                  [
                    folderId,
                    "All Assets",
                    folderPath,
                    (/* @__PURE__ */ new Date()).toISOString()
                  ],
                  () => {
                    console.log("\u2705 Library initialized at:", LIBRARY_PATH);
                    resolve({
                      success: true,
                      libraryPath: LIBRARY_PATH
                    });
                  }
                );
              } else {
                console.log("\u2705 Library initialized at:", LIBRARY_PATH);
                resolve({
                  success: true,
                  libraryPath: LIBRARY_PATH
                });
              }
            }
          );
        });
      });
    } catch (error) {
      console.error("\u274C Failed to initialize library:", error);
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}
function getDb() {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeLibrary() first."
    );
  }
  return db;
}
function getFolders() {
  return new Promise((resolve) => {
    const db2 = getDb();
    db2.all(
      `SELECT id, name, path, parentFolderId, dateCreated FROM folders ORDER BY name`,
      (err, rows) => {
        resolve(rows || []);
      }
    );
  });
}
function getDefaultFolderId() {
  return new Promise((resolve) => {
    const db2 = getDb();
    db2.get(
      "SELECT id FROM folders WHERE name = 'All Assets'",
      (err, row) => {
        resolve(row?.id || null);
      }
    );
  });
}
function getAssetsByFolder(folderId) {
  return new Promise((resolve) => {
    const db2 = getDb();
    db2.all(
      `SELECT id, name, path, type, folderId, dateAdded, dateModified, fileSize
       FROM assets WHERE folderId = ? ORDER BY dateAdded DESC`,
      [folderId],
      (err, rows) => {
        resolve(rows || []);
      }
    );
  });
}
function addAssetToDb(asset) {
  return new Promise((resolve) => {
    const db2 = getDb();
    const id = v4_default();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db2.run(
      `INSERT INTO assets (id, name, path, type, folderId, dateAdded, dateModified, fileSize)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        asset.name,
        asset.path,
        asset.type,
        asset.folderId,
        now,
        now,
        asset.fileSize
      ],
      () => resolve(id)
    );
  });
}
async function importAssets(files, targetFolderId) {
  const folderId = targetFolderId || await getDefaultFolderId();
  if (!folderId) {
    throw new Error("No target folder specified and no default folder found");
  }
  const db2 = getDb();
  return new Promise(async (resolve) => {
    db2.get(
      "SELECT path FROM folders WHERE id = ?",
      [folderId],
      async (err, row) => {
        if (!row) {
          throw new Error("Target folder not found");
        }
        const targetFolderPath = row.path;
        const importedAssets = [];
        for (const file of files) {
          try {
            const fileName = path.basename(file.filePath);
            const relativeLibraryPath = path.join(targetFolderPath, fileName);
            const absoluteLibraryPath = path.join(
              LIBRARY_PATH,
              relativeLibraryPath
            );
            await fs.move(file.filePath, absoluteLibraryPath, {
              overwrite: false
            });
            const stats = await fs.stat(absoluteLibraryPath);
            const type = getFileType(fileName);
            const assetId = await addAssetToDb({
              name: fileName,
              path: relativeLibraryPath,
              type,
              folderId,
              fileSize: stats.size
            });
            importedAssets.push({
              id: assetId,
              name: fileName,
              path: relativeLibraryPath,
              type,
              fileSize: stats.size,
              folderId,
              dateAdded: (/* @__PURE__ */ new Date()).toISOString(),
              dateModified: (/* @__PURE__ */ new Date()).toISOString()
            });
            console.log(`\u2705 Imported: ${fileName}`);
          } catch (error) {
            console.error(`\u274C Failed to import ${file.fileName}:`, error);
          }
        }
        resolve(importedAssets);
      }
    );
  });
}
function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const videoExts = [".mp4", ".mov", ".avi", ".mkv"];
  const docExts = [".pdf", ".doc", ".docx", ".txt"];
  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (docExts.includes(ext)) return "document";
  return "file";
}
function closeLibrary() {
  if (db) {
    db.close();
    db = null;
  }
}
function getLibraryPath() {
  return LIBRARY_PATH;
}
function createFolder(folderName, parentFolderId) {
  return new Promise((resolve, reject) => {
    const db2 = getDb();
    let parentPath = "";
    if (parentFolderId) {
      db2.get(
        "SELECT path FROM folders WHERE id = ?",
        [parentFolderId],
        (err, row) => {
          if (!row) {
            reject(new Error("Parent folder not found"));
            return;
          }
          doCreateFolder(row.path);
        }
      );
    } else {
      doCreateFolder("");
    }
    function doCreateFolder(parentPath2) {
      try {
        const folderId = v4_default();
        const folderPath = parentPath2 ? path.join(parentPath2, folderName) : folderName;
        const absoluteFolderPath = path.join(LIBRARY_PATH, folderPath);
        fs.ensureDirSync(absoluteFolderPath);
        db2.run(
          `INSERT INTO folders (id, name, path, parentFolderId, dateCreated)
           VALUES (?, ?, ?, ?, ?)`,
          [
            folderId,
            folderName,
            folderPath,
            parentFolderId || null,
            (/* @__PURE__ */ new Date()).toISOString()
          ],
          () => {
            console.log(`\u2705 Created folder: ${folderName}`);
            resolve({
              id: folderId,
              name: folderName,
              path: folderPath
            });
          }
        );
      } catch (error) {
        reject(error);
      }
    }
  });
}
function deleteFolder(folderId) {
  return new Promise((resolve, reject) => {
    const db2 = getDb();
    db2.get(
      "SELECT path FROM folders WHERE id = ?",
      [folderId],
      async (err, row) => {
        if (!row) {
          reject(new Error("Folder not found"));
          return;
        }
        try {
          const folderPath = row.path;
          const absoluteFolderPath = path.join(LIBRARY_PATH, folderPath);
          await fs.remove(absoluteFolderPath);
          db2.run("DELETE FROM folders WHERE id = ?", [folderId], () => {
            console.log(`\u2705 Deleted folder: ${folderPath}`);
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}
function renameFolder(folderId, newName) {
  return new Promise((resolve, reject) => {
    const db2 = getDb();
    db2.get(
      "SELECT path, parentFolderId FROM folders WHERE id = ?",
      [folderId],
      async (err, row) => {
        if (!row) {
          reject(new Error("Folder not found"));
          return;
        }
        try {
          const oldPath = row.path;
          const parentPath = oldPath.includes("\\") ? oldPath.substring(0, oldPath.lastIndexOf("\\")) : "";
          const newPath = parentPath ? path.join(parentPath, newName) : newName;
          const oldAbsolutePath = path.join(LIBRARY_PATH, oldPath);
          const newAbsolutePath = path.join(LIBRARY_PATH, newPath);
          await fs.rename(oldAbsolutePath, newAbsolutePath);
          db2.run(
            `UPDATE folders SET path = ?, name = ? WHERE id = ?`,
            [newPath, newName, folderId],
            () => {
              console.log(`\u2705 Renamed folder to: ${newName}`);
              resolve();
            }
          );
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}
function createTag(tagName, color) {
  return new Promise((resolve, reject) => {
    const db2 = getDb();
    const tagId = v4_default();
    const tagColor = color || "#3B82F6";
    db2.run(
      `INSERT INTO tags (id, name, color, dateCreated)
       VALUES (?, ?, ?, ?)`,
      [tagId, tagName, tagColor, (/* @__PURE__ */ new Date()).toISOString()],
      () => {
        console.log(`\u2705 Created tag: ${tagName}`);
        resolve({
          id: tagId,
          name: tagName,
          color: tagColor
        });
      }
    );
  });
}
function getAllTags() {
  return new Promise((resolve) => {
    const db2 = getDb();
    db2.all(
      `SELECT id, name, color, dateCreated FROM tags ORDER BY name`,
      (err, rows) => {
        resolve(rows || []);
      }
    );
  });
}
function getAssetTags(assetId) {
  return new Promise((resolve) => {
    const db2 = getDb();
    db2.all(
      `SELECT t.id, t.name, t.color FROM tags t
       JOIN asset_tags at ON t.id = at.tagId
       WHERE at.assetId = ?
       ORDER BY t.name`,
      [assetId],
      (err, rows) => {
        resolve(rows || []);
      }
    );
  });
}
function addTagToAsset(assetId, tagId) {
  return new Promise((resolve, reject) => {
    const db2 = getDb();
    db2.run(
      `INSERT OR IGNORE INTO asset_tags (assetId, tagId) VALUES (?, ?)`,
      [assetId, tagId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}
function removeTagFromAsset(assetId, tagId) {
  return new Promise((resolve, reject) => {
    const db2 = getDb();
    db2.run(
      `DELETE FROM asset_tags WHERE assetId = ? AND tagId = ?`,
      [assetId, tagId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}
function deleteTag(tagId) {
  return new Promise((resolve, reject) => {
    const db2 = getDb();
    db2.run(`DELETE FROM asset_tags WHERE tagId = ?`, [tagId], () => {
      db2.run(`DELETE FROM tags WHERE id = ?`, [tagId], () => {
        console.log(`\u2705 Deleted tag`);
        resolve();
      });
    });
  });
}
function cleanupMissingAssets() {
  return new Promise((resolve) => {
    const db2 = getDb();
    db2.all(`SELECT id, path FROM assets`, async (err, rows) => {
      if (!rows || rows.length === 0) {
        resolve(0);
        return;
      }
      let deletedCount = 0;
      for (const row of rows) {
        const assetFullPath = path.join(LIBRARY_PATH, row.path);
        const exists = await fs.pathExists(assetFullPath);
        if (!exists) {
          db2.run(`DELETE FROM assets WHERE id = ?`, [row.id], () => {
            console.log(`\u{1F9F9} Removed missing asset from DB: ${row.path}`);
          });
          deletedCount++;
        }
      }
      console.log(
        `\u2705 Cleanup complete: removed ${deletedCount} missing assets`
      );
      resolve(deletedCount);
    });
  });
}
var LIBRARY_PATH, GLIMPSE_DIR, DB_PATH, THUMBNAILS_DIR, db;
var init_libraryManager = __esm({
  "src/services/libraryManager.ts"() {
    init_dist_node();
    LIBRARY_PATH = path.join(os.homedir(), "GlimpseLibrary");
    GLIMPSE_DIR = path.join(LIBRARY_PATH, ".glimpse");
    DB_PATH = path.join(GLIMPSE_DIR, "glimpse.db");
    THUMBNAILS_DIR = path.join(GLIMPSE_DIR, "thumbnails");
    db = null;
  }
});

// src/services/thumbnailManager.ts
var thumbnailManager_exports = {};
__export(thumbnailManager_exports, {
  clearThumbnailCache: () => clearThumbnailCache,
  getDominantColors: () => getDominantColors,
  getThumbnail: () => getThumbnail
});
import path2 from "path";
import os2 from "os";
import fs2 from "fs-extra";
import sharp from "sharp";
async function isThumbnailValid(thumbnailPath) {
  try {
    const stat = await fs2.stat(thumbnailPath);
    if (stat.size === 0) return false;
    await sharp(thumbnailPath).stats();
    return true;
  } catch {
    return false;
  }
}
async function ensureThumbnail(assetFullPath, thumbnailPath) {
  if (await fs2.pathExists(thumbnailPath)) {
    if (await isThumbnailValid(thumbnailPath)) {
      return;
    }
    console.warn("Cached thumbnail is corrupt, regenerating:", thumbnailPath);
    await fs2.remove(thumbnailPath).catch(() => {
    });
  }
  const existing = inFlightGenerations.get(thumbnailPath);
  if (existing) {
    return existing;
  }
  const genPromise = (async () => {
    await fs2.ensureDir(THUMBNAILS_DIR2);
    const tmpPath = `${thumbnailPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      await sharp(assetFullPath).resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: "cover",
        position: "center"
      }).flatten({ background: { r: 255, g: 255, b: 255 } }).png().toFile(tmpPath);
      await fs2.move(tmpPath, thumbnailPath, { overwrite: true });
      const fileStats = await fs2.stat(thumbnailPath);
      console.log(
        `\u2705 Generated thumbnail: ${path2.basename(thumbnailPath)}, size: ${fileStats.size} bytes`
      );
    } catch (err) {
      await fs2.remove(tmpPath).catch(() => {
      });
      throw err;
    }
  })();
  inFlightGenerations.set(thumbnailPath, genPromise);
  try {
    await genPromise;
  } finally {
    inFlightGenerations.delete(thumbnailPath);
  }
}
async function getThumbnail(assetPath) {
  try {
    const assetFullPath = path2.join(LIBRARY_PATH2, assetPath);
    if (!await fs2.pathExists(assetFullPath)) {
      console.warn("Asset file not found:", assetFullPath);
      return null;
    }
    const ext = path2.extname(assetFullPath).toLowerCase();
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    if (!imageExts.includes(ext)) {
      return null;
    }
    const thumbnailName = Buffer.from(assetPath).toString("base64").replace(/[/+=]/g, "_");
    const thumbnailPath = path2.join(THUMBNAILS_DIR2, `${thumbnailName}.png`);
    try {
      await ensureThumbnail(assetFullPath, thumbnailPath);
    } catch (sharpError) {
      console.error("Sharp error generating thumbnail:", sharpError);
      return null;
    }
    const thumbnailBuffer = await fs2.readFile(thumbnailPath);
    const base64 = thumbnailBuffer.toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("Error generating thumbnail for", assetPath, ":", error);
    return null;
  }
}
async function getDominantColors(assetPath) {
  try {
    const assetFullPath = path2.join(LIBRARY_PATH2, assetPath);
    if (!await fs2.pathExists(assetFullPath)) {
      return [];
    }
    const ext = path2.extname(assetFullPath).toLowerCase();
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    if (!imageExts.includes(ext)) {
      return [];
    }
    return [];
  } catch (error) {
    console.error("Error getting dominant colors for", assetPath, ":", error);
    return [];
  }
}
async function clearThumbnailCache() {
  try {
    await fs2.emptyDir(THUMBNAILS_DIR2);
    console.log("\u2705 Thumbnail cache cleared");
  } catch (error) {
    console.error("Error clearing thumbnail cache:", error);
  }
}
var LIBRARY_PATH2, THUMBNAILS_DIR2, THUMBNAIL_SIZE, inFlightGenerations;
var init_thumbnailManager = __esm({
  "src/services/thumbnailManager.ts"() {
    LIBRARY_PATH2 = path2.join(os2.homedir(), "GlimpseLibrary");
    THUMBNAILS_DIR2 = path2.join(LIBRARY_PATH2, ".glimpse", "thumbnails");
    THUMBNAIL_SIZE = 200;
    inFlightGenerations = /* @__PURE__ */ new Map();
  }
});

// src/electron/main.ts
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path3 from "path";
import { fileURLToPath } from "url";

// node_modules/electron-is-dev/index.js
import electron from "electron";
if (typeof electron === "string") {
  throw new TypeError("Not running in an Electron environment!");
}
var { env } = process;
var isEnvSet = "ELECTRON_IS_DEV" in env;
var getFromEnv = Number.parseInt(env.ELECTRON_IS_DEV, 10) === 1;
var isDev = isEnvSet ? getFromEnv : !electron.app.isPackaged;
var electron_is_dev_default = isDev;

// src/electron/main.ts
init_libraryManager();
import fs3 from "fs-extra";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var mainWindow = null;
function createWindow() {
  const preloadPath = path3.join(__dirname, "preload.cjs");
  console.log("Preload path:", preloadPath);
  console.log("Preload exists:", fs3.existsSync(preloadPath));
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  const startUrl = electron_is_dev_default ? "http://localhost:5173" : `file://${path3.join(__dirname, "../../dist/index.html")}`;
  mainWindow.loadURL(startUrl);
  if (electron_is_dev_default) mainWindow.webContents.openDevTools();
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
initializeLibrary().catch((error) => {
  console.error("Failed to initialize library:", error);
});
app.disableHardwareAcceleration();
app.on("ready", createWindow);
app.whenReady().then(() => {
});
app.on("window-all-closed", () => {
  closeLibrary();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
ipcMain.handle("dialog:openFile", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Images",
        extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg"]
      },
      { name: "All Files", extensions: ["*"] }
    ]
  });
  console.log("Dialog result:", result.filePaths);
  return result.filePaths;
});
ipcMain.handle(
  "library:importAssets",
  async (event, files, folderId) => {
    const { importAssets: importAssets2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
    return await importAssets2(files, folderId);
  }
);
ipcMain.handle("library:getAssets", async (event, folderId) => {
  const { getAssetsByFolder: getAssetsByFolder2, getDefaultFolderId: getDefaultFolderId2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
  const targetFolderId = folderId || await getDefaultFolderId2();
  if (!targetFolderId) return [];
  return getAssetsByFolder2(targetFolderId);
});
ipcMain.handle("fs:getFileInfo", async (event, filePath) => {
  try {
    const stats = await fs3.stat(filePath);
    return {
      path: filePath,
      name: path3.basename(filePath),
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    console.error("Error getting file info:", error);
    return null;
  }
});
ipcMain.handle("thumbnail:get", async (event, assetPath) => {
  const { getThumbnail: getThumbnail2 } = await Promise.resolve().then(() => (init_thumbnailManager(), thumbnailManager_exports));
  return await getThumbnail2(assetPath);
});
ipcMain.handle("thumbnail:getColors", async (event, assetPath) => {
  const { getDominantColors: getDominantColors2 } = await Promise.resolve().then(() => (init_thumbnailManager(), thumbnailManager_exports));
  return await getDominantColors2(assetPath);
});
ipcMain.handle(
  "library:createFolder",
  async (event, folderName, parentFolderId) => {
    const { createFolder: createFolder2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
    return await createFolder2(folderName, parentFolderId);
  }
);
ipcMain.handle("library:getFolders", async (event) => {
  const { getFolders: getFolders2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
  return await getFolders2();
});
ipcMain.handle("library:deleteFolder", async (event, folderId) => {
  const { deleteFolder: deleteFolder2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
  return await deleteFolder2(folderId);
});
ipcMain.handle(
  "library:renameFolder",
  async (event, folderId, newName) => {
    const { renameFolder: renameFolder2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
    return await renameFolder2(folderId, newName);
  }
);
ipcMain.handle("library:getAllTags", async (event) => {
  const { getAllTags: getAllTags2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
  return await getAllTags2();
});
ipcMain.handle("library:getAssetTags", async (event, assetId) => {
  const { getAssetTags: getAssetTags2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
  return await getAssetTags2(assetId);
});
ipcMain.handle(
  "library:createTag",
  async (event, tagName, color) => {
    const { createTag: createTag2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
    return await createTag2(tagName, color);
  }
);
ipcMain.handle(
  "library:addTagToAsset",
  async (event, assetId, tagId) => {
    const { addTagToAsset: addTagToAsset2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
    return await addTagToAsset2(assetId, tagId);
  }
);
ipcMain.handle(
  "library:removeTagFromAsset",
  async (event, assetId, tagId) => {
    const { removeTagFromAsset: removeTagFromAsset2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
    return await removeTagFromAsset2(assetId, tagId);
  }
);
ipcMain.handle("library:deleteTag", async (event, tagId) => {
  const { deleteTag: deleteTag2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
  return await deleteTag2(tagId);
});
ipcMain.handle("library:cleanupMissingAssets", async (event) => {
  const { cleanupMissingAssets: cleanupMissingAssets2 } = await Promise.resolve().then(() => (init_libraryManager(), libraryManager_exports));
  return await cleanupMissingAssets2();
});
