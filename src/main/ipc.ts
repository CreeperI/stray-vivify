import { ChartType, Invoke, IpcHandlers, storages } from '../preload/types'
import { existsSync, readFileSync } from 'fs'
import VsbParser from './vsbParser'
import * as electron from 'electron'
import { dialog, ipcMain, shell } from 'electron'
import { basename } from 'node:path'
import { MainStorage } from './store'
import  ElectronStore  from 'electron-store'
import ChartManager from './chart_manager'

export function load_ipc_handlers(
  store: ElectronStore<storages.storage_scheme>,
  mainWindow: Electron.BrowserWindow
) {
  const handler = Handler(store, mainWindow)
  for (const key of Object.keys(handler)) {
    ipcMain.handle(key, handler[key])
  }
  // console.log("loaded song handlers")
}

const Handler = (
  store: ElectronStore<storages.storage_scheme>,
  mw: Electron.BrowserWindow
): IpcHandlers.invoke.handler => {
  const chart_manager = ChartManager()
  const sender = mw.webContents.send.bind(mw.webContents) as IpcHandlers.send.send
  return {
    'ask-song': function (_): Invoke['ask-song']['r'] {
      const x = dialog.showOpenDialogSync({
        properties: ['openFile'],
        filters: [{ name: 'Music Files', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }]
      })
      if (!x) return undefined
      return { path: x[0], name: basename(x[0]) }
    },
    'ask-vsb': function (_): Invoke['ask-vsb']['r'] {
      const x = dialog.showOpenDialogSync({
        properties: ['openFile'],
        filters: [{ name: 'VSB', extensions: ['vsb'] }]
      })
      if (!x) return undefined
      return { path: x[0], name: basename(x[0]) }
    },
    'get-file-buffer': function (_, fp) {
      if (existsSync(fp)) {
        return { state: 'success', data: readFileSync(fp) }
      } else {
        return { state: 'failed', msg: '' }
      }
    },
    'open-url': function (_, url: string) {
      electron.shell.openExternal(url)
    },
    'read-vsb': function (_, p) {
      if (!existsSync(p)) return
      const buf = readFileSync(p)
      return new VsbParser(buf).runToNotes()
    },
    'save-chart': function (_, id, data) {
      chart_manager.write_chart(id, JSON.parse(data))
    },
    'set-storage': MainStorage.set,
    // @ts-ignore
    'import-song': async function (_, music_path: string) {
      const id = (await new Promise((resolve) => {
        sender('ask-id', chart_manager.id_list())
        ipcMain.once('return-id', (_, id: undefined | string) => {
          if (!id) resolve(0)
          else resolve(id)
        })
      })) as string | 0
      if (id == 0) return { state: 'cancelled' } as const
      return chart_manager.import_song(music_path, id)
    },
    'open-song': function (_, id: string) {
      if (chart_manager.exists(id)) {
        return chart_manager.open_song(id)
      }
      return
    },
    'get-charts-data': function (_) {
      return chart_manager.chart_list()
    },
    'update-chart-data': function (_, id:string, data) {
      const data1 = JSON.parse(data) as {song: ChartType.song, diffs: string[]}
      chart_manager.update_chart(id, data1.song.name, data1.song.composer, data1.song.bpm, data1.diffs)
    },
    'get-shortcut-data': function(_) {
      // @ts-ignore
      return store.get('shortcut')
    },
    'write-vsc': function(_,id, ch, name) {
      const fp = chart_manager.write_vsc(id, ch, name)
      if (!fp) return
      shell.showItemInFolder(fp)
    },
    'get-settings-data': function(_) {
      // @ts-ignore
      return store.get('settings')
    }
  }
}
