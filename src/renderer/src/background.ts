import { app, BrowserWindow } from 'electron'
import * as process from 'node:process'

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1000,
    height: 700
  })

  if (process.argv[2]) {
    win.loadURL(process.argv[2])
  } else {
    win.loadFile('index.html')
  }
})
