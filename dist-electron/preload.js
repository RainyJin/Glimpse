// src/electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, args) => ipcRenderer.send(channel, args),
    receive: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  dialog: {
    openFile: () => ipcRenderer.invoke("dialog:openFile")
  },
  fs: {
    getFileInfo: (filePath) => ipcRenderer.invoke("fs:getFileInfo", filePath)
  }
});
