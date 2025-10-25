import { ChartType, Invoke, IpcHandlers } from '../preload/types'
import fs, { existsSync, readFileSync } from 'fs'
import VsbParser from './vsbParser'
import * as electron from 'electron'
import { app, dialog, ipcMain, shell } from 'electron'
import path, { basename } from 'node:path'
import ChartManager from './chart-manager'
import { file_paths, folder_size } from './fp-parser'
import { OszReader } from './osz-reader'

export function load_ipc_handlers(mainWindow: Electron.BrowserWindow) {
  const handler = Handler(mainWindow)
  for (const key of Object.keys(handler)) {
    ipcMain.handle(key, handler[key])
  }
  // console.log("loaded song handlers")
}

const Handler = (mw: Electron.BrowserWindow) => {
  const chart_manager = new ChartManager(mw)
  const sender = mw.webContents.send.bind(mw.webContents) as IpcHandlers.send.send
  function ask_id() {
    return new Promise<string | undefined>((resolve) => {
      sender('ask-id', chart_manager.id_list())
      ipcMain.once('return-id', (_, id: undefined | string) => {
        resolve(id)
      })
    })
  }
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
      console.log('saved chart: ' + id)
    },
    'import-song': async function (_, music_path: string) {
      const id = (await ask_id()) as string | undefined
      if (id == undefined) return { state: 'cancelled' }
      return chart_manager.import_song(music_path, id)
    },
    'open-song': function (_, id: string) {
      console.log(id)
      if (chart_manager.exists(id)) {
        return chart_manager.open_song(id)
      }
      // this wont be triggered bc in open_song it will fuck
      throw new Error('')
    },
    'get-charts-data': function (_) {
      return chart_manager.chart_list()
    },
    'update-chart-data': function (_, id: string, data) {
      const data1 = JSON.parse(data) as { song: ChartType.song; diffs: string[] }
      chart_manager.update_chart(
        id,
        data1.song.name,
        data1.song.composer,
        data1.song.bpm,
        data1.diffs
      )
    },
    'write-vsc': function (_, id, ch, name) {
      const fp = chart_manager.write_vsc(id, ch, name)
      if (!fp) return
      shell.showItemInFolder(fp)
    },
    'get-conf': function (_) {
      if (fs.existsSync(file_paths.config)) {
        return fs.readFileSync(file_paths.config, 'utf-8')
      } else return undefined
    },
    'save-conf': function (_, data) {
      fs.writeFileSync(file_paths.config, data, 'utf-8')
    },
    'backup-chart': function (_, id, data) {
      chart_manager.backup_chart(id, data)
    },
    'init-data': function (_) {
      const cd = chart_manager.chart_list()
      let conf: string | undefined = undefined
      if (fs.existsSync(file_paths.config)) {
        conf = fs.readFileSync(file_paths.config, 'utf-8')
      }
      let skin: string | undefined = undefined
      if (fs.existsSync(file_paths.skin)) {
        skin = fs.readFileSync(file_paths.skin, 'utf-8')
      }
      return {
        conf: conf,
        skin: skin,
        cd: cd
      }
    },
    'export-svc': function (_, id) {
      chart_manager.export_svc(id)
    },
    'export-zip': (_, id) => {
      chart_manager.export_zip(id)
    },
    'import-zip': function (_) {
      return chart_manager.import_chart()
    },
    'remove-chart': function (_, id) {
      chart_manager.remove_chart(id)
    },
    'import-sprite': (_, id) => {
      chart_manager.import_sprite(id)
    },
    'import-background': (_, id) => {
      chart_manager.import_bg(id)
    },
    'enter-fullscreen': () => {
      mw.setFullScreen(true)
    },
    'leave-fullscreen': () => {
      mw.setFullScreen(false)
    },
    'write-file': (_, id, fname, data) => {
      chart_manager.write_file(id, fname, data)
    },
    'show-file': (_, id, fname) => {
      chart_manager.show_file(id, fname)
    },
    'open-skin-folder': () => {
      shell.showItemInFolder(path.join(file_paths.skin, '1.png'))
    },
    'read-osz': () => {
      const fp = dialog.showOpenDialogSync({
        properties: ['openFile'],
        filters: [{ name: 'OSZ', extensions: ['osz'] }]
      })
      if (!fp) return
      const osz = new OszReader(fp[0])
      return {
        song: osz.get_song(),
        diff: osz.get_diffs()
      }
    },
    'import-from-osz': async () => {
      const fp = dialog.showOpenDialogSync({
        properties: ['openFile'],
        filters: [{ name: 'OSZ', extensions: ['osz'] }]
      })
      if (!fp) return
      const osz = new OszReader(fp[0])
      const song = osz.getAudioFile()
      if (!song) return
      const id = await ask_id()
      if (!id) return
      chart_manager.create_with_buffer(id, song[1], song[0])
    },
    'import-osz-pics': (_, id) => {
      const fp = dialog.showOpenDialogSync({
        properties: ['openFile'],
        filters: [{ name: 'OSZ', extensions: ['osz'] }]
      })
      if (!fp) return
      const osz = new OszReader(fp[0])
      const images = osz.getImages()
      if (images.length == 0) return
      chart_manager.import_osz_sprite(id, images[0][0], images[0][1])
    },
    'export-preview-svg': (_, id, svg_text) => {
      chart_manager.write_svg_text(id, svg_text)
    },
    'open-dev': () => {
      mw.webContents.openDevTools({ mode: 'right' })
    },
    'memory-backend': () => {
      return process.memoryUsage()
    },
    'is-dev': () => {
      return process.env.NODE_ENV === 'development'
    },
    'charts-size': async () => {
      const what = fs.readdirSync(file_paths.charts)
      let detail: [number, string][] = []
      let detailsf: [number, string][] = []
      for (let i = 0; i < what.length; i++) {
        const lstat = fs.lstatSync(path.join(file_paths.charts, what[i]))
        if (lstat.isDirectory())
          detail.push([await folder_size(path.join(file_paths.charts, what[i])), what[i]])
        else detailsf.push([lstat.size, what[i]])
      }
      const _app = await folder_size(app.getPath('userData'))
      const _exe = await folder_size(path.dirname(app.getPath('module')))
      const _total = await folder_size(file_paths.charts)
      return {
        detail: detail,
        detail_sf: detailsf,
        app: _app,
        exe: _exe,
        total: _total
      }
    },
    'ask-file': (_, f) => {
      const fp = dialog.showOpenDialogSync({
        properties: ['openFile'],
        filters: [{ name: f[0], extensions: f.slice(1) }]
      })
      if (!fp) return
      return fp[0]
    },
    'open-file-utf': (_, fp) => {
      if (!fs.existsSync(fp)) return
      return fs.readFileSync(fp, 'utf-8')
    },
    'create-folder': (_, id, name) => {
      if (fs.existsSync(path.join(file_paths.charts, id)))
        if (fs.existsSync(path.join(file_paths.charts, id, name))) return 1
      return 0
    },
    'write-blob': (_, id: string, _name: string, _blob: string) => {
      if (fs.existsSync(path.join(file_paths.charts, id))) {
        fs.writeFileSync(path.join(file_paths.charts, id, _name), Buffer.from(_blob), 'binary')
      }
    }
  } as Required<IpcHandlers.invoke.handler>
}
