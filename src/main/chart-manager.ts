import path, { extname } from 'node:path'
import fs from 'fs'
import { charts_data, ChartType, ChartTypeV2, IpcHandlers } from '../preload/types'
import * as electron from 'electron'
import { dialog, ipcMain, shell } from 'electron'
import { file_paths } from './fp-parser'
import AdmZip from 'adm-zip'
import { find_png, find_song } from './stray'
import * as child_process from 'node:child_process'

function timestr() {
  const date = new Date()
  return `${date.getHours()}${date.getMinutes()}${date.getSeconds()}`
}

export default class ChartManager {
  private readonly charts_folder: string
  private data: charts_data = []
  private readonly json_path: string

  constructor(private mw: Electron.BrowserWindow) {
    this.charts_folder = file_paths.charts
    this.json_path = path.join(this.charts_folder, 'charts.json')
    this.read_json()
    this.possible_charts()
  }

  add_chart(
    id: string,
    name: string,
    composer: string,
    bpm: string,
    ext: string,
    diffs: string[],
    last_open?: number
  ) {
    this.data.push({
      last_open: last_open ?? Date.now(),
      id,
      name,
      composer,
      bpm,
      ext,
      diffs
    })
    this.write_json()
  }

  update_chart(id: string, name: string, composer: string, bpm: string, diffs: string[]) {
    const chart = this.data.find((v) => v.id === id)
    if (chart) {
      chart.name = name
      chart.composer = composer
      chart.bpm = bpm
      chart.diffs = diffs
      this.write_json()
    }
  }

  import_song(fp: string, id: string) {
    const folder = path.join(this.charts_folder, id)
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
      if (fs.existsSync(path.join(path.dirname(fp), 'vs-chart.json'))) {
        const chart = JSON.parse(
          fs.readFileSync(path.join(folder, 'vs-chart.json'), 'utf-8')
        ) as ChartTypeV2.final
        if (chart.version)
          this.add_chart(
            id,
            path.basename(fp, path.extname(fp)),
            chart.song.composer,
            chart.song.bpm,
            path.extname(fp),
            chart.diffs.map((v) => v.meta.diff1 + ' ' + v.meta.diff2)
          )
      } else {
        this.add_chart(
          id,
          path.basename(fp, path.extname(fp)),
          'unknown',
          'unknown',
          path.extname(fp),
          []
        )
      }
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

  exists(id: string) {
    return this.data.some((v) => v.id === id)
  }

  remove_chart(id: string) {
    const index = this.data.findIndex((v) => v.id === id)
    if (index !== -1) {
      this.data.splice(index, 1)
      try {
        fs.rmSync(path.join(this.charts_folder, id), { recursive: true, force: true })
      } catch (e) {
        dialog.showErrorBox('Error', `Error removing song id ${id}.`)
      }
      this.write_json()
    }
  }

  id_list() {
    return this.data.map((v) => v.id)
  }

  chart_list() {
    return this.data
  }

  write_file(id: string, fname: string, data: string) {
    const chart = this.data.find((v) => v.id === id)
    if (chart) {
      fs.writeFileSync(path.join(this.charts_folder, id, fname), data)
    }
  }

  read_chart(id: string, ext: string) {
    const folder = path.join(this.charts_folder, id)
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

  open_song(id: string) {
    const chart = this.data.find((v) => v.id === id)
    if (chart) {
      chart.last_open = Date.now()
      this.write_json()
      return this.read_chart(id, chart.ext)
    } else {
      this.remove_chart(id)
    }
    dialog.showErrorBox('Error', `Error opening song id ${id}, check if it exists.`)
    throw new Error('???')
  }

  write_chart(id: string, chd: ChartType.Chart) {
    const chart = this.data.find((v) => v.id === id)
    if (chart) {
      fs.writeFileSync(
        path.join(this.charts_folder, id, 'vs-chart.json'),
        JSON.stringify(chd, null, 2)
      )
    }
  }

  backup_chart(id: string, d: string) {
    const chart = this.data.find((v) => v.id === id)
    if (chart) {
      fs.writeFileSync(path.join(this.charts_folder, id, 'backup.json'), JSON.stringify(d, null, 2))
    }
  }

  write_vsc(id: string, ch: string, name: string) {
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return
    const fp = path.join(this.charts_folder, id, name + '.vsc')
    fs.writeFileSync(fp, ch)
    return fp
  }

  export_svc(id: string) {
    this._export_chart(id, '.svc')
  }
  export_zip(id: string) {
    this._export_chart(id, '.zip')
  }

  show_file(id: string, fp: string) {
    shell.showItemInFolder(path.join(this.charts_folder, id, fp))
  }

  async import_chart() {
    const sender = this.mw.webContents.send.bind(this.mw.webContents) as IpcHandlers.send.send
    const zip_file = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{ name: 'stray-vivify chart', extensions: ['svc', 'zip'] }]
    })
    if (!zip_file) return
    const zip = new AdmZip(zip_file[0])
    const zip_entry = zip.getEntries()
    const json = zip_entry.find((v) => v.entryName === 'vs-chart.json')
    const song = zip_entry.find((v) => {
      return ['.mp3', '.wav', '.ogg', '.m4a'].includes(path.extname(v.entryName))
    })
    const sprite = zip_entry.find((v) => {
      return (
        ['.png', '.jpg', '.jpeg', '.gif'].includes(path.extname(v.entryName)) &&
        v.entryName.includes('song')
      )
    })
    const bg = zip_entry.find((v) => {
      return (
        ['.png', '.jpg', '.jpeg', '.gif'].includes(path.extname(v.entryName)) &&
        v.entryName.includes('bg')
      )
    })
    if (!json || !song) {
      await sender('notify-error', 'zip corrupted', 1000)
      return
    }
    const id = (await new Promise((r) => {
      sender(
        'ask-id',
        this.id_list(),
        path
          .basename(zip_file[0])
          .replace(path.extname(zip_file[0]), '')
          .toLowerCase()
          .replace(' ', '')
      )
      ipcMain.once('return-id', (_, id: undefined | string) => {
        if (!id) r(0)
        else r(id)
      })
    })) as string | 0
    if (id == 0) {
      await sender('notify-normal', '取消导入。', 1000)
      return
    }
    try {
      fs.mkdirSync(path.join(this.charts_folder, id))
      fs.writeFileSync(
        path.join(this.charts_folder, id, 'vs-chart.json'),
        json.getData().toString('utf-8'),
        { encoding: 'utf-8' }
      )
      fs.writeFileSync(
        path.join(this.charts_folder, id, path.basename(song.entryName)),
        song.getData()
      )
      if (sprite) {
        fs.writeFileSync(
          path.join(this.charts_folder, id, path.basename(sprite.entryName)),
          sprite.getData()
        )
      }
      if (bg) {
        fs.writeFileSync(
          path.join(this.charts_folder, id, path.basename(bg.entryName)),
          bg.getData()
        )
      }
      this.add_chart(
        id,
        path.basename(song.entryName, path.extname(song.entryName)),
        'unknown',
        'unknown',
        path.extname(song.entryName),
        []
      )
    } catch (e) {
      sender('notify-error', '导入失败', 1000)
    }
  }

  import_sprite(id: string) {
    const png = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{ name: 'pictures', extensions: ['png', 'jpg', 'gif', '.jpeg'] }]
    })
    if (!png) return
    try {
      fs.copyFileSync(png[0], path.join(this.charts_folder, id, 'song' + path.extname(png[0])))
    } catch (e) {
      return
    }
  }

  import_bg(id: string) {
    const png = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{ name: 'pictures', extensions: ['png', 'jpg', 'gif', '.jpeg'] }]
    })
    if (!png) return
    try {
      fs.copyFileSync(png[0], path.join(this.charts_folder, id, 'bg' + path.extname(png[0])))
    } catch (e) {
      return
    }
  }

  create_with_buffer(id: string, buf: Buffer, ext: string) {
    const folder = path.join(this.charts_folder, id)
    if (fs.existsSync(folder)) return 0
    fs.mkdirSync(folder)
    fs.writeFileSync(path.join(folder, 'song' + ext), buf)
    this.add_chart(id, 'song', 'unknown', 'unknown', ext, [])
    return 1
  }

  import_osz_sprite(id: string, buf: Buffer, ext: string) {
    const folder = path.join(this.charts_folder, id)
    if (fs.existsSync(path.join(folder, 'song' + ext))) fs.rmSync(path.join(folder, 'song' + ext))
    fs.writeFileSync(path.join(folder, 'song' + ext), buf)
  }

  write_svg_text(id: string, text: string) {
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return

    const img = electron.nativeImage.createFromDataURL(text)
    const png_buffer = img.toPNG()

    const fname = `preview-${id}-${timestr()}`

    fs.writeFileSync(path.join(this.charts_folder, id, fname + '.png'), png_buffer)
    shell.showItemInFolder(path.join(this.charts_folder, id, fname + '.png'))
  }

  export_for_custom(data: {
    id: string
    diffs: (string | 0)[]
    crop?: boolean
    gml: string
    as_id?: string
    sv?:boolean
  }) {
    const { id, diffs, crop = false, gml, as_id = -1, sv=false} = data
    // if all is 0
    if (!diffs.some((v) => v != 0)) return
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return

    const exported_path =
      as_id == -1
        ? path.join(this.charts_folder, id, `exported-${timestr()}`)
        : path.join(this.charts_folder, id, as_id)
    if (as_id != -1) {
      try {
        fs.rmSync(exported_path, {force: true, recursive: true})
        console.log('removed old')
      } catch (e) {
        console.log(e)
      }
    }
    fs.mkdirSync(exported_path)

    const vsc_names = ['OPENING', 'MIDDLE', 'FINALE', 'ENCORE']
    for (let i = 0; i < diffs.length; i++) {
      const diff = diffs[i]
      if (diff == 0) continue
      try {
        fs.writeFileSync(path.join(exported_path, vsc_names[i] + '.vsc'), diff)
      } catch (e) {
        // pass
      }
    }

    fs.writeFileSync(path.join(exported_path, 'songinfo.json'), gml)
    const png = find_png(path.join(this.charts_folder, id), 'song')
    if (png && crop !== undefined) {
      try {
        const imagePath = path.join(this.charts_folder, id, png)
        const image = electron.nativeImage.createFromPath(imagePath)
        const { width, height } = image.getSize()
        let processedImage: Electron.NativeImage
        if (crop) {
          // Crop to square (centered)
          const size = Math.min(width, height)
          const x = (width - size) / 2
          const y = (height - size) / 2
          processedImage = image.crop({ x, y, width: size, height: size })
        } else {
          // Stretch to square
          const size = Math.max(width, height)
          processedImage = image.resize({ width: size, height: size })
        }
        fs.writeFileSync(path.join(exported_path, `jacket.png`), processedImage.toPNG())
      } catch (e) {
        // pass
      }
    }
    if (sv) {
      fs.copyFileSync(path.join(this.charts_folder, id, "vs-chart.json"), path.join(exported_path, "vs-chart.json"))
      const _png = find_png(path.join(this.charts_folder, id), "song")
      if (_png) {
        fs.copyFileSync(path.join(this.charts_folder, id, _png), path.join(exported_path, "song.png"))
      }
      const _song = find_song(path.join(this.charts_folder, id), "song")
      if (_song) {
        fs.copyFileSync(path.join(this.charts_folder, id, _song), path.join(exported_path, `song${extname(_song)}`))
      }
    }
    child_process.exec("ls")
    shell.showItemInFolder(path.join(exported_path, "songinfo.json"))
  }


  private _export_chart(id: string, ext: string) {
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return
    const zip = new AdmZip()
    const chart_folder = path.join(this.charts_folder, id)
    zip.addLocalFile(path.join(chart_folder, 'song' + chart.ext))
    zip.addLocalFile(path.join(chart_folder, 'vs-chart.json'))
    const sprite = find_png(chart_folder, 'song')
    if (sprite) zip.addLocalFile(path.join(chart_folder, sprite))
    const bg = find_png(chart_folder, 'bg')
    if (bg) zip.addLocalFile(path.join(chart_folder, bg))

    zip.writeZip(path.join(this.charts_folder, id + ext))
    shell.showItemInFolder(path.join(this.charts_folder, id + ext))
  }

  private init_json() {
    if (!fs.existsSync(this.charts_folder)) {
      fs.mkdirSync(this.charts_folder)
    }
    fs.writeFileSync(this.json_path, JSON.stringify([], null, 2))
  }

  private write_json() {
    if (fs.existsSync(this.json_path)) {
      fs.writeFileSync(this.json_path, JSON.stringify(this.data, null, 2))
    }
  }

  private guard_data() {
    for (const chart of this.data) {
      chart.diffs = chart.diffs ?? []
    }
  }

  private read_json() {
    if (fs.existsSync(this.json_path)) {
      const content = fs.readFileSync(this.json_path, 'utf-8')
      this.data.push(...JSON.parse(content))
      this.guard_data()
    } else {
      this.init_json()
    }
  }

  private possible_charts() {
    const json_charts = this.data.map((v) => v.id)
    const folders = fs
      .readdirSync(this.charts_folder)
      .filter((v) => {
        return fs.lstatSync(path.join(this.charts_folder, v)).isDirectory()
      })
      .filter((v) => !json_charts.includes(v))

    // so we got those folders excluded in json!
    for (const folder of folders) {
      if (fs.existsSync(path.join(this.charts_folder, folder, 'vs-chart.json'))) {
        const chart = JSON.parse(
          fs.readFileSync(path.join(this.charts_folder, folder, 'vs-chart.json'), 'utf-8')
        ) as ChartTypeV2.final
        const song = find_song(path.join(this.charts_folder, folder), 'song')
        if (!song) continue
        // old version fuck
        if (!chart.version) continue
        this.add_chart(
          folder,
          chart.song.name,
          chart.song.composer,
          chart.song.bpm,
          path.extname(song),
          chart.diffs.map((v) => v.meta.diff1 + ' ' + v.meta.diff2),
          0
        )
      }
    }
  }
}
