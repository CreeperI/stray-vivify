import { dirname, join } from 'path'
import fs, { existsSync, readFileSync } from 'fs'
import { dialog, ipcMain } from 'electron'
import { ChartType, HandlerReturn } from '../preload/types'
import { basename } from 'node:path'
import VsbParser from './vsbParser'
import * as electron from 'electron'

/*export class Charter {
  notes: Ref<ChartType.notes_data>
  music: HTMLAudioElement
  jsonPath: string
  diffs: { name: string; notes: ChartType.notes_data }[]
  diff_name: string

  constructor(musicPath: string) {
    document.title = basename(musicPath)
    this.music = new Audio(musicPath)
    this.jsonPath = join(dirname(musicPath), 'vs-chart.json')
    this.diffs = [new_diff()]
    this.diff_name = 'Finale'
    this.notes = ref([])
    if (existsSync(this.jsonPath)) {
      const data = JSON.parse(readFileSync(this.jsonPath, 'utf-8')) as ChartType.save_data
      this.notes = ref(data.diffs[0].notes)
      this.diff_name = data.diffs[0].name
    } else {
      try {
        writeFileSync(
          this.jsonPath,
          JSON.stringify({
            diffs: this.diffs,
            save_time: Date.now()
          })
        )
      } catch (err) {
        console.log(err)
      }
    }
  }

  static openFrom(p: string) {
    if (existsSync(p)) {
      return new Charter(p)
    } else {
      return
    }
  }

  static open(win: BrowserWindow) {
    const music = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{ name: '音乐', extensions: ['mp3', 'wav', 'ogg'] }]
    })
    if (music) {
      const json_path = join(dirname(music[0]), 'vs-chart.json')
      if (fs.existsSync(json_path)) {
        const data = JSON.parse(fs.readFileSync(json_path, 'utf-8')) as ChartType.save_data
        win.webContents.send('chart-data', music[0], data)
      }
    }
  }

  getNotes() {
    return this.notes.value
  }

  saveChart() {
    writeFileSync(
      this.jsonPath,
      JSON.stringify({
        notes: this.notes.value
      })
    )
  }
}*/

function readJson(p: string) {
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as ChartType.Chart
}

export function handlers() {
  ipcMain.handle('ask-song', (): HandlerReturn.askPath => {
    const x = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{ name: 'Music Files', extensions: ['mp3', 'wav', 'ogg','m4a'] }]
    })
    if (!x) return undefined
    return { path: x[0], name: basename(x[0]) }
  })

  ipcMain.handle('ask-vsb', (): HandlerReturn.askPath => {
    const x = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{ name: 'VSB', extensions: ['vsb'] }]
    })
    if (!x) return undefined
    return { path: x[0], name: basename(x[0]) }
  })

  ipcMain.handle('save-chart', (_, music_path: string, data: string) => {
    const json_path = join(dirname(music_path), 'vs-chart.json')
    fs.writeFileSync(json_path, data)
  })

  ipcMain.handle('get-file-buffer', (_, pa: string): HandlerReturn.OpenBuffer => {
    if (existsSync(pa)) {
      return { state: 'success', data: readFileSync(pa) }
    } else {
      return { state: 'failed', msg: '' }
    }
  })

  ipcMain.handle('open-chart', (_, p: string): HandlerReturn.OpenChart => {
    if (!existsSync(p)) return { state: 'missing' }
    const json_path = join(dirname(p), 'vs-chart.json')
    const buf = readFileSync(p)
    if (existsSync(json_path)) {
      const data = readJson(json_path)
      return {
        state: 'success',
        buf,
        chart: data,
        name: basename(p)
      }
    } else {
      return {
        state: 'created',
        buf,
        name: basename(p)
      }
    }
  })
  ipcMain.handle('open-exist-chart', (_, p: string): HandlerReturn.OpenExistChart => {
    if (!existsSync(p)) return { state: 'missing' }
    const json_path = join(dirname(p), 'vs-chart.json')
    if (existsSync(json_path)) {
      const data = readJson(json_path)
      return {
        state: 'success',
        chart: data,
        buf: readFileSync(p),
        path: p,
        name: basename(p)
      }
    } else {
      return {
        state: 'created',
        buf: readFileSync(p),
        path: p,
        name: basename(p)
      }
    }
  })
  ipcMain.handle('read-vsb', (_, p: string): HandlerReturn.readVsb => {
    if (!existsSync(p)) return
    const buf = readFileSync(p)
    return new VsbParser(buf).runToNotes()
  })
  ipcMain.handle("open-url",(_, p:string):void => {
    electron.shell.openExternal(p)
  })
}
