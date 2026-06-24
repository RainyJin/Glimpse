import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";
import fs from "fs-extra";
import { initializeLibrary, closeLibrary } from "../services/libraryManager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Build the preload script path
  const preloadPath = path.join(__dirname, "preload.cjs");
  console.log("Preload path:", preloadPath);
  console.log("Preload exists:", fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../../dist/index.html")}`;

  mainWindow.loadURL(startUrl);
  if (isDev) mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Initialize library when app starts
initializeLibrary().catch((error) => {
  console.error("Failed to initialize library:", error);
});
app.disableHardwareAcceleration();

app.on("ready", createWindow);

// Add this after app.on('ready')
app.whenReady().then(() => {
  // Register file protocol for thumbnails
  // This is already allowed by default in modern Electron
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

// IPC handlers
ipcMain.handle("dialog:openFile", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Images",
        extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
      },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  console.log("Dialog result:", result.filePaths);
  return result.filePaths;
});

ipcMain.handle(
  "library:importAssets",
  async (event, files: any[], folderId?: string) => {
    const { importAssets } = await import("../services/libraryManager");
    return await importAssets(files, folderId);
  },
);

ipcMain.handle("library:getAssets", async (event, folderId?: string) => {
  const { getAssetsByFolder, getDefaultFolderId } =
    await import("../services/libraryManager");

  const targetFolderId = folderId || (await getDefaultFolderId());
  if (!targetFolderId) return [];

  return getAssetsByFolder(targetFolderId);
});

ipcMain.handle("fs:getFileInfo", async (event, filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    console.error("Error getting file info:", error);
    return null;
  }
});

ipcMain.handle("thumbnail:get", async (event, assetPath: string) => {
  const { getThumbnail } = await import("../services/thumbnailManager");
  return await getThumbnail(assetPath);
});

ipcMain.handle("thumbnail:getColors", async (event, assetPath: string) => {
  const { getDominantColors } = await import("../services/thumbnailManager");
  return await getDominantColors(assetPath);
});

ipcMain.handle(
  "library:createFolder",
  async (event, folderName: string, parentFolderId?: string) => {
    const { createFolder } = await import("../services/libraryManager");
    return await createFolder(folderName, parentFolderId);
  },
);

ipcMain.handle("library:getFolders", async (event) => {
  const { getFolders } = await import("../services/libraryManager");
  return await getFolders();
});

ipcMain.handle("library:deleteFolder", async (event, folderId: string) => {
  const { deleteFolder } = await import("../services/libraryManager");
  return await deleteFolder(folderId);
});

ipcMain.handle(
  "library:renameFolder",
  async (event, folderId: string, newName: string) => {
    const { renameFolder } = await import("../services/libraryManager");
    return await renameFolder(folderId, newName);
  },
);

ipcMain.handle("library:getAllTags", async (event) => {
  const { getAllTags } = await import("../services/libraryManager");
  return await getAllTags();
});

ipcMain.handle("library:getAssetTags", async (event, assetId: string) => {
  const { getAssetTags } = await import("../services/libraryManager");
  return await getAssetTags(assetId);
});

ipcMain.handle(
  "library:createTag",
  async (event, tagName: string, color?: string) => {
    const { createTag } = await import("../services/libraryManager");
    return await createTag(tagName, color);
  },
);

ipcMain.handle(
  "library:addTagToAsset",
  async (event, assetId: string, tagId: string) => {
    const { addTagToAsset } = await import("../services/libraryManager");
    return await addTagToAsset(assetId, tagId);
  },
);

ipcMain.handle(
  "library:removeTagFromAsset",
  async (event, assetId: string, tagId: string) => {
    const { removeTagFromAsset } = await import("../services/libraryManager");
    return await removeTagFromAsset(assetId, tagId);
  },
);

ipcMain.handle("library:deleteTag", async (event, tagId: string) => {
  const { deleteTag } = await import("../services/libraryManager");
  return await deleteTag(tagId);
});

ipcMain.handle("library:cleanupMissingAssets", async (event) => {
  const { cleanupMissingAssets } = await import("../services/libraryManager");
  return await cleanupMissingAssets();
});
