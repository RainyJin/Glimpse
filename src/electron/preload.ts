import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel: string, args: any) => ipcRenderer.send(channel, args),
    receive: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
  },
  dialog: {
    openFile: () => ipcRenderer.invoke("dialog:openFile"),
  },
  fs: {
    getFileInfo: (filePath: string) =>
      ipcRenderer.invoke("fs:getFileInfo", filePath),
  },
  library: {
    importAssets: (files: any[], folderId?: string) =>
      ipcRenderer.invoke("library:importAssets", files, folderId),
    getAssets: (folderId?: string) =>
      ipcRenderer.invoke("library:getAssets", folderId),
    getFolders: () => ipcRenderer.invoke("library:getFolders"),
    createFolder: (folderName: string, parentFolderId?: string) =>
      ipcRenderer.invoke("library:createFolder", folderName, parentFolderId),
    deleteFolder: (folderId: string) =>
      ipcRenderer.invoke("library:deleteFolder", folderId),
    renameFolder: (folderId: string, newName: string) =>
      ipcRenderer.invoke("library:renameFolder", folderId, newName),
    getAllTags: () => ipcRenderer.invoke("library:getAllTags"),
    getAssetTags: (assetId: string) =>
      ipcRenderer.invoke("library:getAssetTags", assetId),
    createTag: (tagName: string, color?: string) =>
      ipcRenderer.invoke("library:createTag", tagName, color),
    addTagToAsset: (assetId: string, tagId: string) =>
      ipcRenderer.invoke("library:addTagToAsset", assetId, tagId),
    removeTagFromAsset: (assetId: string, tagId: string) =>
      ipcRenderer.invoke("library:removeTagFromAsset", assetId, tagId),
    deleteTag: (tagId: string) =>
      ipcRenderer.invoke("library:deleteTag", tagId),
    cleanupMissingAssets: () =>
      ipcRenderer.invoke("library:cleanupMissingAssets"),
  },
  thumbnail: {
    get: (assetPath: string) => ipcRenderer.invoke("thumbnail:get", assetPath),
    getColors: (assetPath: string) =>
      ipcRenderer.invoke("thumbnail:getColors", assetPath),
  },
});
