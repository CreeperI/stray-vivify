import { ref, type Ref } from 'vue'
import { join, dirname, basename } from 'path-browserify'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { BrowserWindow, ipcMain } from 'electron'
import fs from 'fs'
import { ChartType, OpenChartReturn } from '../preload/chartType'
import {dialog} from "electron"

function toSaveData(data: ChartType.ChartData) {
  return {
    diffs: data.diffs,
    save_time: Date.now()
  }
}

function new_diff(): { name: string; notes: ChartType.notes_data } {
  return {
    name: 'Finale',
    notes: [[0, 0, 3, 0]]
  }
}

export class Charter {
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
}

function readJson(p: string) {
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as ChartType.save_data
}

export function handleChart() {
  ipcMain.handle('open-new-chart', () => {
    const music = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{ name: '音乐', extensions: ['mp3', 'wav', 'ogg'] }]
    })
    if (music) {
      const json_path = join(dirname(music[0]), 'vs-chart.json')
      if (fs.existsSync(json_path)) {
        const data = readJson(json_path)
        return {
          state: 'success',
          music: music[0],
          data: data.diffs[0]
        }
      } else {
        fs.writeFileSync(
          json_path,
          JSON.stringify({
            diffs: [new_diff()],
            save_time: Date.now()
          })
        )
        return {
          state: 'created',
          music: music[0],
          data: new_diff()
        }
      }
    } else {
      return {
        state: 'cancel'
      }
    }
  })

  ipcMain.handle('open-exist-chart', (_, music_path: string): OpenChartReturn => {
    if (!fs.existsSync(music_path)) return { state: 'missing' }
    const json_path = join(dirname(music_path), 'vs-chart.json')
    if (fs.existsSync(json_path)) {
      const data = readJson(json_path)
      return {
        state: 'success',
        music: music_path,
        data: data.diffs
      }
    } else {
      fs.writeFileSync(
        json_path,
        JSON.stringify({
          diffs: [new_diff()],
          save_time: Date.now()
        })
      )
      return {
        state: 'new_json',
        music: music_path,
        data: [new_diff()]
      }
    }
  })

  ipcMain.handle('save-chart', (_, music_path: string, data: ChartType.ChartData) => {
    const json_path = join(dirname(music_path), 'vs-chart.json')
    fs.writeFileSync(json_path, JSON.stringify(toSaveData(data)))
  })
}
