const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron')
const path = require('path')

const MENU_STRINGS = {
  it: {
    about: 'Info su ', file: 'File', nuovaScheda: 'Nuova scheda', apriJson: 'Apri JSON…',
    salvaJson: 'Salva JSON…', stampa: 'Stampa / Esporta PDF', esci: 'Esci',
    modifica: 'Modifica', annulla: 'Annulla', ripeti: 'Ripeti', taglia: 'Taglia',
    copia: 'Copia', incolla: 'Incolla', selezionaTutto: 'Seleziona tutto',
    visualizza: 'Visualizza', ricarica: 'Ricarica', zoomNormale: 'Zoom normale',
    ingrandisci: 'Ingrandisci', riduci: 'Riduci', schermoIntero: 'Schermo intero'
  },
  en: {
    about: 'About ', file: 'File', nuovaScheda: 'New show', apriJson: 'Open JSON…',
    salvaJson: 'Save JSON…', stampa: 'Print / Export PDF', esci: 'Quit',
    modifica: 'Edit', annulla: 'Undo', ripeti: 'Redo', taglia: 'Cut',
    copia: 'Copy', incolla: 'Paste', selezionaTutto: 'Select All',
    visualizza: 'View', ricarica: 'Reload', zoomNormale: 'Actual Size',
    ingrandisci: 'Zoom In', riduci: 'Zoom Out', schermoIntero: 'Toggle Full Screen'
  }
}

function buildMenuTemplate(lang) {
  const s = MENU_STRINGS[lang] || MENU_STRINGS.it
  return [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: s.about + app.name },
        { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: s.file,
      submenu: [
        { label: s.nuovaScheda, accelerator: 'CmdOrCtrl+N', click: (_, win) => win && win.webContents.executeJavaScript('showTemplateModal()') },
        { label: s.apriJson, accelerator: 'CmdOrCtrl+O', click: (_, win) => win && win.webContents.executeJavaScript('loadFile()') },
        { label: s.salvaJson, accelerator: 'CmdOrCtrl+S', click: (_, win) => win && win.webContents.executeJavaScript('exportJSON()') },
        { type: 'separator' },
        { label: s.stampa, accelerator: 'CmdOrCtrl+P', click: (_, win) => win && win.webContents.executeJavaScript('printScheda()') },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit', label: s.esci }
      ]
    },
    {
      label: s.modifica,
      submenu: [
        { role: 'undo', label: s.annulla },
        { role: 'redo', label: s.ripeti },
        { type: 'separator' },
        { role: 'cut', label: s.taglia },
        { role: 'copy', label: s.copia },
        { role: 'paste', label: s.incolla },
        { role: 'selectAll', label: s.selezionaTutto }
      ]
    },
    {
      label: s.visualizza,
      submenu: [
        { label: s.ricarica, accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { type: 'separator' },
        { role: 'resetZoom', label: s.zoomNormale },
        { role: 'zoomIn', label: s.ingrandisci },
        { role: 'zoomOut', label: s.riduci },
        { type: 'separator' },
        { role: 'togglefullscreen', label: s.schermoIntero }
      ]
    }
  ]
}

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
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
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

ipcMain.on('set-language', (_event, lang) => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate(lang)))
})

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate('it')))
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
