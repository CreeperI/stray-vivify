import { app, BrowserWindow, dialog, globalShortcut, ipcMain, protocol, shell } from 'electron'
import { dirname, join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { basename, extname } from 'node:path'
import { load_ipc_handlers } from './ipc'

function window_max(win: BrowserWindow) {
  if (win.isMaximized()) {
    win.restore()
  } else {
    win.maximize()
  }
  win.webContents.send('window-max-state', win.isMaximized())
}

function check_skin_path() {
  const sp = get_skin_path()
  if (!fs.existsSync(sp)) {
    dialog.showErrorBox(
      'Errorrrrrr!',
      'Cannot find skin folder. \n' + 'Please check if the /skin folder exists.\nPending:' + sp
    )
    app.quit()
  }
}

function get_skin_path() {
  if (process.env.NODE_ENV === 'development') {
    return join(__dirname, '../../resources')
  } else if (process.platform === 'darwin') {
    return join(dirname(app.getPath('module')), 'skin')
  } else {
    return join(dirname(app.getPath('module')), 'skin')
  }
}

function get_config_path() {
  if (process.env.NODE_ENV === 'development') {
    return join(__dirname, '../../config.json')
  } else if (process.platform === 'darwin') {
    return join(dirname(app.getPath('module')), 'config.json')
  } else {
    return join(dirname(app.getPath('module')), 'config.json')
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

function convertPath(originalPath: string) {
  const match = originalPath.match(/^\/([a-zA-Z])\/(.*)$/)
  if (match) {
    // fuck for windows
    return `${match[1]}:/${match[2]}`
  } else {
    return originalPath
  }
}

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
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  listen(mainWindow)
  load_ipc_handlers(mainWindow, get_config_path())
  // globalShortcut.register('F11', () => window_max(mainWindow))
  globalShortcut.register('Alt+F12', () => {
    mainWindow.webContents.openDevTools({ mode: 'right' })
  })
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

  const skin_path = get_skin_path()

  process.title = 'stray/vivify'
  protocol.handle('stray', (request) => {
    const decodedUrl = decodeURIComponent(request.url.replace(new RegExp(`^stray:/`, 'i'), ''))
    console.log(decodedUrl)
    const fullPath = process.platform === 'win32' ? convertPath(decodedUrl) : decodedUrl
    if (decodedUrl.includes('__skin__')) {
      return new Response(fs.readFileSync(join(skin_path, basename(fullPath))))
    }

    if (decodedUrl.includes('__song__')) {
      const song_path = decodedUrl.replace('/__song__/', '')
      return new Response(fs.readFileSync(song_path), {
        headers: {
          'Content-Type': 'audio/' + extname(song_path).replace('.', ''),
          'Content-Disposition': 'inline'
        }
      })
    }

    const data = fs.readFileSync(fullPath)
    return new Response(data)
  })
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
