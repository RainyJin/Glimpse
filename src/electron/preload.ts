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
});
