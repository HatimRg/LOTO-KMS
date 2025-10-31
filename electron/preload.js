// Preload script to expose IPC safely
const { contextBridge, ipcRenderer } = require('electron');

// Expose ipcRenderer to the renderer process
contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  removeListener: (channel, func) => ipcRenderer.removeListener(channel, func)
});
