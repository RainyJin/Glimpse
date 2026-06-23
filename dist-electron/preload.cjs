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
  }
});
