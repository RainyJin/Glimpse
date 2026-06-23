// src/electron/main.ts
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
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
import fs from "fs-extra";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var mainWindow = null;
function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");
  console.log("Preload path:", preloadPath);
  console.log("Preload exists:", fs.existsSync(preloadPath));
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  const startUrl = electron_is_dev_default ? "http://localhost:5173" : `file://${path.join(__dirname, "../../dist/index.html")}`;
  mainWindow.loadURL(startUrl);
  if (electron_is_dev_default) mainWindow.webContents.openDevTools();
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.on("ready", createWindow);
app.on("window-all-closed", () => {
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
ipcMain.handle("fs:getFileInfo", async (event, filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    console.error("Error getting file info:", error);
    return null;
  }
});
