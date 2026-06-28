const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: 'ShowRider',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#141414',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  })

  win.loadFile('index.html')

  win.once('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

const menuTemplate = [
  ...(process.platform === 'darwin' ? [{
    label: app.name,
    submenu: [
      { role: 'about', label: 'Info su ' + app.name },
      { type: 'separator' },
      { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  {
    label: 'File',
    submenu: [
      { label: 'Nuova scheda', accelerator: 'CmdOrCtrl+N', click: (_, win) => win && win.webContents.executeJavaScript('showTemplateModal()') },
      { label: 'Apri JSON…', accelerator: 'CmdOrCtrl+O', click: (_, win) => win && win.webContents.executeJavaScript('loadFile()') },
      { label: 'Salva JSON…', accelerator: 'CmdOrCtrl+S', click: (_, win) => win && win.webContents.executeJavaScript('exportJSON()') },
      { type: 'separator' },
      { label: 'Stampa / Esporta PDF', accelerator: 'CmdOrCtrl+P', click: (_, win) => win && win.webContents.executeJavaScript('printScheda()') },
      { type: 'separator' },
      process.platform === 'darwin' ? { role: 'close' } : { role: 'quit', label: 'Esci' }
    ]
  },
  {
    label: 'Modifica',
    submenu: [
      { role: 'undo', label: 'Annulla' },
      { role: 'redo', label: 'Ripeti' },
      { type: 'separator' },
      { role: 'cut', label: 'Taglia' },
      { role: 'copy', label: 'Copia' },
      { role: 'paste', label: 'Incolla' },
      { role: 'selectAll', label: 'Seleziona tutto' }
    ]
  },
  {
    label: 'Visualizza',
    submenu: [
      { label: 'Ricarica', accelerator: 'CmdOrCtrl+R', role: 'reload' },
      { type: 'separator' },
      { role: 'resetZoom', label: 'Zoom normale' },
      { role: 'zoomIn', label: 'Ingrandisci' },
      { role: 'zoomOut', label: 'Riduci' },
      { type: 'separator' },
      { role: 'togglefullscreen', label: 'Schermo intero' }
    ]
  }
]

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
