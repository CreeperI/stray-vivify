import {app, BrowserWindow} from "electron"
import * as process from "node:process";

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    }
  })

  if (process.argv[2]) {
    win.loadURL(process.argv[2])
  } else {
    win.loadFile("index.html")
  }

})
