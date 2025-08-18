import { app, BrowserWindow, dialog, globalShortcut, ipcMain, protocol, shell } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { load_ipc_handlers } from './ipc'
import { file_paths } from './fp_parser'
import { stray_handler } from './stray'

function window_max(win: BrowserWindow) {
  if (win.isMaximized()) {
    win.restore()
  } else {
    win.maximize()
  }
  win.webContents.send('window-max-state', win.isMaximized())
}

function check_skin_path() {
  const sp = file_paths.skin
  if (!fs.existsSync(sp)) {
    dialog.showErrorBox(
      'Errorrrrrr!',
      'Cannot find skin folder. \n' + 'Please check if the /skin folder exists.\nPending:' + sp
    )
    app.quit()
  }
}

// https://github.com/xieerduos/electron-custom-protocol-local-resource-example
// yes i want to change something like how to read files... then
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'stray',
    privileges: {
      secure: true,
      stream: true,
      standard: true,
      bypassCSP: true,
      supportFetchAPI: true
    }
  }
])

function listen(win: BrowserWindow) {
  ipcMain.on('window-close', () => {
    win.close()
  })

  ipcMain.on('window-min', () => {
    win.minimize()
  })

  ipcMain.on('window-max', () => window_max(win))
  win.on('resize', () => {
    win.webContents.send('window-resize', win.isMaximized())
  })

  ipcMain.handle('window-max-state', () => win.isMaximized())
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1080,
    height: 800,
    show: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      sandbox: false,
      preload: join(__dirname, '../preload/index.js')
    },
    frame: false,
    icon: icon
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'allow' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // globalShortcut.register('F11', () => window_max(mainWindow))
    globalShortcut.register('Alt+F12', () => {
      mainWindow.webContents.openDevTools({ mode: 'right' })
    })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  listen(mainWindow)
  load_ipc_handlers(mainWindow)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.stray.vivify')

  check_skin_path()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  process.title = 'stray/vivify'
  protocol.handle('stray', stray_handler())
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
