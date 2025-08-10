import path from 'node:path'
import fs from 'fs'
import { charts_data, ChartType } from '../preload/types'
import { dirname, join } from 'path'
import { app, dialog } from 'electron'

function ChartManager() {
  const charts_folder = (function () {
    if (process.env.NODE_ENV === 'development') {
      return join(__dirname, '../../charts/')
    } else if (process.platform === 'darwin') {
      return join(dirname(app.getPath('module')), 'charts')
    } else {
      return join(dirname(app.getPath('module')), 'charts/')
    }
  })()
  console.log(charts_folder)
  const data: charts_data = []
  const json_path = path.join(charts_folder, 'charts.json')

  function init_json() {
    if (!fs.existsSync(charts_folder)) {
      fs.mkdirSync(charts_folder)
    }
    fs.writeFileSync(json_path, JSON.stringify([], null, 2))
  }

  function write_json() {
    if (fs.existsSync(json_path)) {
      fs.writeFileSync(json_path, JSON.stringify(data, null, 2))
    }
  }

  function guard_data() {
    for (let i = 0; i < data.length; i++) {
      const chart = data[i]
      chart.diffs = chart.diffs ?? []
    }
  }

  function read_json() {
    if (fs.existsSync(json_path)) {
      const content = fs.readFileSync(json_path, 'utf-8')
      data.push(...JSON.parse(content))
      guard_data()
    } else {
      init_json()
    }
  }

  /**
   * ext {string} .mp3
   * */
  function add_chart(
    id: string,
    name: string,
    composer: string,
    bpm: string,
    ext: string,
    diffs: string[]
  ) {
    data.push({
      last_open: Date.now(),
      id,
      name,
      composer,
      bpm,
      ext,
      diffs
    })
    write_json()
  }

  function update_chart(id: string, name: string, composer: string, bpm: string, diffs: string[]) {
    const chart = data.find((v) => v.id === id)
    if (chart) {
      chart.name = name
      chart.composer = composer
      chart.bpm = bpm
      chart.diffs = diffs
      write_json()
    }
  }

  function import_song(fp: string, id: string) {
    const folder = path.join(charts_folder, id)
    if (fs.existsSync(folder)) {
      return {
        state: 'existed'
      }
    }
    try {
      fs.mkdirSync(folder)
      const song_path = path.join(folder, 'song' + path.extname(fp))
      fs.copyFileSync(fp, song_path)
      if (fs.existsSync(path.join(path.dirname(fp), 'vs-chart.json'))) {
        fs.copyFileSync(
          path.join(path.dirname(fp), 'vs-chart.json'),
          path.join(folder, 'vs-chart.json')
        )
      }

      add_chart(id, path.basename(fp, path.extname(fp)), 'unknown', 'unknown', path.extname(fp), [])
      return {
        state: 'success',
        folder: song_path,
        json: path.join(folder, 'vs-chart.json')
      }
    } catch (e) {
      return {
        state: 'failed',
        reason: JSON.stringify(e)
      }
    }
  }

  function exists(id: string) {
    return data.some((v) => v.id === id)
  }

  // function data_of(id: string) {
  //   return data.find((v) => v.id === id)
  // }
  // function $data_of(id:string) {
  //   const r = data_of(id)
  //   if (!r) throw new Error("what id unfound:" + id)
  //   return r
  // }

  function remove_chart(id: string) {
    const index = data.findIndex((v) => v.id === id)
    if (index !== -1) {
      data.splice(index, 1)
      fs.rmSync(path.join(charts_folder, id), { recursive: true, force: true })
      write_json()
    }
  }

  function id_list() {
    return data.map((v) => v.id)
  }

  function chart_list() {
    return data
  }

  function read_chart(id: string, ext: string) {
    const folder = path.join(charts_folder, id)
    if (fs.existsSync(path.join(folder, 'vs-chart.json'))) {
      return {
        data: fs.readFileSync(path.join(folder, 'vs-chart.json'), 'utf-8'),
        path: path.join(folder, 'song' + ext)
      }
    }
    return {
      data: undefined,
      path: path.join(folder, 'song' + ext)
    }
  }

  function open_song(id: string) {
    const chart = data.find((v) => v.id === id)
    if (chart) {
      chart.last_open = Date.now()
      write_json()
      return read_chart(id, chart.ext)
    } else {
      remove_chart(id)
    }
    dialog.showErrorBox('Error', `Error opening song id ${id}, check if it exists.`)
    throw new Error('???')
  }

  function write_chart(id: string, chd: ChartType.Chart) {
    const chart = data.find((v) => v.id === id)
    if (chart) {
      fs.writeFileSync(path.join(charts_folder, id, 'vs-chart.json'), JSON.stringify(chd, null, 2))
    }
  }

  function backup_chart(id: string, d: string) {
    const chart = data.find((v) => v.id === id)
    if (chart) {
      fs.writeFileSync(path.join(charts_folder, id, 'backup.json'), JSON.stringify(d, null, 2))
    }
  }

  function write_vsc(id: string, ch: string, name: string) {
    const chart = data.find((v) => v.id === id)
    if (!chart) return
    const fp = path.join(charts_folder, id, name + '.vsc')
    fs.writeFileSync(fp, ch)
    return fp
  }

  read_json()

  return {
    import_song,
    chart_list,
    id_list,
    exists,
    open_song,
    write_chart,
    update_chart,
    write_vsc,
    backup_chart
  }
}

export default ChartManager
