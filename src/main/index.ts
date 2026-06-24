import { app, BrowserWindow, ipcMain, protocol, session, shell } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { load_ipc_handlers } from './ipc'
import { stray_handler } from './stray'
import { existsSync } from 'fs'

const singleInstanceLock = app.requestSingleInstanceLock()

if (!singleInstanceLock) {
  app.quit()
} else {
  // 当第二个实例被打开时，聚焦到第一个实例的窗口
  app.on('second-instance', () => {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length) {
      if (windows[0].isMinimized()) windows[0].restore()
      windows[0].focus()
    }
  })
}
function window_max(win: BrowserWindow) {
  win.setFullScreen(false)
  if (win.isMaximized()) {
    win.restore()
  } else {
    win.maximize()
  }
  win.webContents.send('window-max-state', win.isMaximized())
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

  ipcMain.on('window-max', () => {
    window_max(win)
  })
  win.on('resize', () => {
    win.webContents.send('window-resize', win.isMaximized())
  })

  let flag = false

  win.on('close', async (e) => {
    if (flag) {
      win.destroy()
      return
    }
    e.preventDefault()
    win.webContents.send('im-closing')
    flag = true
    await new Promise((r) => {
      ipcMain.on('can-close', r)
    })
    win.destroy()
  })

  ipcMain.handle('window-max-state', () => win.isMaximized())

  // fetcher from https://pratikpc.medium.com/bypassing-cors-with-electron-ab7eaf331605
  win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } })
  })

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        'Access-Control-Allow-Origin': ['*'],
        ...details.responseHeaders
      }
    })
  })
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
      preload: join(__dirname, '../preload/index.js'),
      backgroundThrottling: false
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
    const pixiDevToolsPath = 'L:\\playground\\chrome'
    if (existsSync(pixiDevToolsPath))
      session.defaultSession.loadExtension(pixiDevToolsPath).catch((err) => {
        console.log('Failed to load PixiJS DevTools extension:', err)
      })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  listen(mainWindow)
  load_ipc_handlers(mainWindow)
  mainWindow.title = 'stray/vivify'
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.stray.vivify')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  // app.on('browser-window-created', (_, window) => {
  //    optimizer.watchWindowShortcuts(window)
  // })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

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
