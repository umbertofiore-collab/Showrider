const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setLanguage: (lang) => ipcRenderer.send('set-language', lang),
  attachDocFile: (showId) => ipcRenderer.invoke('attach-doc-file', showId),
  openAttachment: (showId, stored) => ipcRenderer.invoke('open-attachment', showId, stored),
  removeAttachment: (showId, stored) => ipcRenderer.invoke('remove-attachment', showId, stored),
  exportAttachmentsBase64: (showId, fileRefs) => ipcRenderer.invoke('export-attachments-base64', showId, fileRefs),
  importAttachmentsBase64: (showId, attachments) => ipcRenderer.invoke('import-attachments-base64', showId, attachments)
})
