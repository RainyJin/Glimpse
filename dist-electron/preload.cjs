// src/electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, args) => import_electron.ipcRenderer.send(channel, args),
    receive: (channel, func) => {
      import_electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  dialog: {
    openFile: () => import_electron.ipcRenderer.invoke("dialog:openFile")
  },
  fs: {
    getFileInfo: (filePath) => import_electron.ipcRenderer.invoke("fs:getFileInfo", filePath)
  },
  library: {
    importAssets: (files, folderId) => import_electron.ipcRenderer.invoke("library:importAssets", files, folderId),
    getAssets: (folderId) => import_electron.ipcRenderer.invoke("library:getAssets", folderId),
    getFolders: () => import_electron.ipcRenderer.invoke("library:getFolders"),
    createFolder: (folderName, parentFolderId) => import_electron.ipcRenderer.invoke("library:createFolder", folderName, parentFolderId),
    deleteFolder: (folderId) => import_electron.ipcRenderer.invoke("library:deleteFolder", folderId),
    renameFolder: (folderId, newName) => import_electron.ipcRenderer.invoke("library:renameFolder", folderId, newName),
    getAllTags: () => import_electron.ipcRenderer.invoke("library:getAllTags"),
    getAssetTags: (assetId) => import_electron.ipcRenderer.invoke("library:getAssetTags", assetId),
    createTag: (tagName, color) => import_electron.ipcRenderer.invoke("library:createTag", tagName, color),
    addTagToAsset: (assetId, tagId) => import_electron.ipcRenderer.invoke("library:addTagToAsset", assetId, tagId),
    removeTagFromAsset: (assetId, tagId) => import_electron.ipcRenderer.invoke("library:removeTagFromAsset", assetId, tagId),
    deleteTag: (tagId) => import_electron.ipcRenderer.invoke("library:deleteTag", tagId),
    cleanupMissingAssets: () => import_electron.ipcRenderer.invoke("library:cleanupMissingAssets")
  },
  thumbnail: {
    get: (assetPath) => import_electron.ipcRenderer.invoke("thumbnail:get", assetPath),
    getColors: (assetPath) => import_electron.ipcRenderer.invoke("thumbnail:getColors", assetPath)
  }
});
