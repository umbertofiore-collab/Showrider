const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setLanguage: (lang) => ipcRenderer.send('set-language', lang)
})
