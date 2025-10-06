import { ChartType, ChartTypeV2 } from '@preload/types'
import { notify } from '@renderer/core/notify'
import { computed, ComputedRef, ref, Ref, toValue, triggerRef, watch, WritableComputedRef } from 'vue'
import { Charter } from '@renderer/core/charter'
import { Chart_audio } from '@renderer/core/chart/audio'
import { Chart_song } from '@renderer/core/chart/song'
import { Chart_diff } from '@renderer/core/chart/diff'
import { Chart_playfield } from './playfield'
import { GlobalStat } from '@renderer/core/globalStat'
import { Settings } from '@renderer/core/settings'
import { modal } from '@renderer/core/modal'
import { Invoke } from '@renderer/core/ipc'
import { utils } from '@renderer/core/utils'
import nextFrame = utils.nextFrame

function isBumper(n: ChartType.note | string) {
  if (typeof n == 'string') return ['b', 's', 'mb'].includes(n)
  return ['b', 's', 'mb'].includes(n.n)
}

export type ms = number

export class Chart {
  static current: Chart | undefined = undefined
  static isBumper = isBumper
  song: Chart_song
  diffs: ChartTypeV2.diff[]
  path: string
  audio: Chart_audio
  diff: Chart_diff
  length: ms
  // for audio counting only
  length_end: ms

  shown_timing: ComputedRef<[ms, ms]>
  current_bpm: WritableComputedRef<number>
  ref: {
    diff_index: Ref<number>
  }
  id: string

  playfield: Chart_playfield | null

  sprite_err :Ref<boolean>
  bg_err: Ref<boolean>

  constructor() {
    this.song = new Chart_song(this)
    this.diffs = [Chart_diff.createDiff()]
    this._diff_index = 0
    this.audio = new Chart_audio(this)
    this.path = ''
    this.length = -1
    this.length_end = -1
    this.shown_timing = computed(() => [
      this.audio.refs.current_ms.value,
      this.audio.refs.current_ms.value + Charter.refs.visible.value
    ])
    const me = this
    this.current_bpm = computed({
      get() {
        return me.bpm_of_time(me.audio.refs.current_ms.value)?.bpm ?? 120
      },
      set(v) {
        const n = me.diff.timing.findLast((tp) => tp.time <= me.audio.current_time)
        if (n) n.bpm = v
      }
    })
    this.ref = {
      diff_index: ref(0)
    }
    this.diff = new Chart_diff(this)
    this.id = ''
    this.playfield = null
    this.sprite_err = ref(false)
    this.bg_err = ref(false)
  }

  static get $current() {
    if (!this.current) throw new Error("where's my chart!")
    return this.current
  }

  _diff_index: number

  get diff_index() {
    return this._diff_index
  }

  set diff_index(v: number) {
    this.ref.diff_index.value = v
    this.diff.bound.value = this.diffs[this.ref.diff_index.value]
    this.set_header_name()
    this._diff_index = v
  }

  get visible_timing() {
    return this.audio.current_time + Charter.refs.visible.value
  }

  get chart(): ChartTypeV2.final {
    return {
      song: this.song.save(),
      diffs: this.diffs,
      version: Settings.version
    }
  }

  /*static create_vsb(vsb_path: string): Promise<Chart> {
    const chart = new Chart()
    chart.set_path(vsb_path)
    return new Promise((resolve, reject) => {
      Charter.invoke('read-vsb', vsb_path).then((r) => {
        if (!r) {
          reject('')
          return
        }
        chart.diff.set_notes(r)
        resolve(chart)
      })
    })
  }*/

  get $playfield() {
    if (!this.playfield) this.init_playfield()
    return this.playfield as Chart_playfield
  }

  static createChart(n = ''): ChartTypeV2.final {
    return {
      song: {
        name: n,
        name_roman: n,
        composer: '',
        composer_roman: '',
        bpm: '120',
        source: 'stray-vivify',
        ref: '',
        sprite: '???'
      },
      diffs: [Chart_diff.createDiff()],
      version: Settings.version
    }
  }

  static create(musicPath: string, musicURL: string): Promise<Chart> {
    const chart = new Chart()
    chart.audio.load_url(musicURL)
    chart.set_path(musicPath)
    return new Promise((resolve) => {
      chart.audio.on_can_play_through(
        () => {
          chart.post_define()
          resolve(chart)
        },
        { once: true }
      )
    })
  }

  static async open_chart(id: string) {
    const file = await Invoke('open-song', id)
    const blob_path = URL.createObjectURL(await this.fetch_blob(file.path))
    const chart = await this.create(id, blob_path)
    if (file.data) {
      const data = this.parse_data(file.data)
      if (data.status == 'converted') {
        await Invoke('backup-chart', id, file.data)
      }
      chart.set_chart(data.data)
      chart.set_name(data.data.song.name)
      chart.diff.calc_max_lane()
      chart.diff.update_timing_list()
    }
    chart.id = id
    this.current = chart
    GlobalStat.route.change('editor')
    watch(
      GlobalStat.route.route,
      () => {
        chart.audio.pause()
      },
      { once: true }
    )
  }

  static async fetch_blob(path: string) {
    const r = await fetch('stray:/__song__/' + path)
    if (r.ok) return await r.blob()
    throw new Error('what fetch failed')
  }

  static parse_data(data: string): { data: ChartTypeV2.final; status: 'converted' | 'loaded' } {
    const parsed = JSON.parse(data) as ChartType.Chart | ChartTypeV2.final
    if (Object.keys(parsed).includes('version')) {
      return {
        data: parsed as ChartTypeV2.final,
        status: 'loaded'
      }
    } else {
      // for the old versions
      const new_data = this.createChart()
      new_data.diffs.pop()

      parsed.diffs.forEach((d) => new_data.diffs.push(this.parse_old_diff(d)))
      new_data.song.name = parsed.song.name
      new_data.song.name_roman = parsed.song.name
      new_data.song.composer = parsed.song.composer
      new_data.song.composer_roman = parsed.song.composer
      new_data.song.bpm = parsed.song.bpm
      return {
        data: new_data,
        status: 'converted'
      }
    }
  }

  static parse_old_diff(dif: ChartType.Diff): ChartTypeV2.diff {
    const new_diff = Chart_diff.createDiff()
    new_diff.timing = []
    dif.notes.forEach((note) => {
      switch (note.n) {
        case 'p':
          new_diff.timing.push({
            time: note.t,
            bpm: note.v,
            num: 4,
            den: 4
          })
          break
        case 'h':
          new_diff.notes.push({
            time: note.t,
            lane: note.l,
            len: note.h,
            width: 1,
            ani: []
          })
          break
        case 'n':
          new_diff.notes.push({
            time: note.t,
            lane: note.l,
            width: 1,
            ani: [],
            snm: 0
          })
          break
        case 'b':
          new_diff.notes.push({
            time: note.t,
            lane: note.l,
            width: 2,
            ani: [],
            snm: 0
          })
          break
        case 's':
          new_diff.notes.push({
            time: note.t,
            lane: note.l,
            width: 2,
            ani: [],
            snm: 2
          })
          break
        case 'm':
          new_diff.notes.push({
            time: note.t,
            lane: note.l,
            width: 1,
            ani: [],
            snm: 1
          })
          break
        case 'mb':
          new_diff.notes.push({
            time: note.t,
            lane: note.l,
            width: 2,
            ani: [],
            snm: 1
          })
          break
        default:
          console.log('waht')
      }
    })
    new_diff.meta.diff1 = dif.name
    new_diff.meta.diff2 = dif.hard
    new_diff.meta.charter = dif.charter
    return new_diff
  }

  load_vsb(r: [ChartTypeV2.note[], ChartTypeV2.timing[]] | undefined) {
    if (!r) return
    const new_diff = Chart_diff.createDiff()
    new_diff.notes = r[0]
    new_diff.timing = r[1]
    this.add_diff(new_diff)
    setTimeout(() => {
      this.diff.fuck_shown(this.audio.current_time, true)
      this.diff.update_diff_counts()
    }, 200)
  }

  load_vsc(r: string) {
    const lines = r.split('\n')
    const notes: ChartTypeV2.note[] = []
    const timing: ChartTypeV2.timing[] = []
    lines.forEach((line) => {
      const [stime, stype, slane, sextra = undefined] = line.split(',')
      const time = parseFloat(stime)
      const type = parseInt(stype)
      const lane = parseInt(slane)
      if (type == 2 && sextra) {
        return notes.push({
          time,
          lane,
          ani: [],
          width: 1,
          len: (parseFloat(sextra) ?? 0) - time
        })
      } else if (type == 3 && sextra) {
        const matched = sextra.split('|')[0].slice(2)
        return timing.push({
          time: time,
          bpm: parseFloat(matched ?? '120'),
          num: 4,
          den: 4
        })
      }
      let width = 1
      let snm = 0
      if (type == 1 || type == 8 || type == 7) width = 2
      if (type == 6 || type == 7) snm = 1
      if (type == 8) snm = 2
      return notes.push({
        time,
        lane,
        width,
        ani: [],
        snm
      })
    })

    const diff = Chart_diff.createDiff()
    diff.notes = Chart_diff.validate_notes(notes)
    diff.timing = Chart_diff.validate_timing(timing)
    this.add_diff(diff)
    setTimeout(() => {
      this.diff.fuck_shown(this.audio.current_time, true)
      this.diff.update_diff_counts()
    }, 200)
  }

  fuck_shown(force = false) {
    this.diff.fuck_shown(this.audio.current_time, force)
  }

  set_path(p: string) {
    this.path = p
  }

  set_name(n: string) {
    this.song.name = n
  }

  set_header_name() {
    GlobalStat.refs.header_display.value =
      this.song.name + ' - ' + this.diff.diff1 + ' ' + this.diff.diff2
  }

  post_define() {
    this.length = (this.audio.ele?.duration ?? -1) * 1000
    this.length_end = this.length + 3000
    this.set_header_name()
    this.audio.init_on_end()
    watch(
      this.ref.diff_index,
      (v) => {
        this._diff_index = v
        this.diff.bound.value = this.diffs[v]
        this.set_header_name()
        this.diff.fuck_shown(this.audio.current_time, true)
        this.diff.calc_density()
        this.diff.update_timing_list()
      },
      { flush: 'post' }
    )
    watch(this.audio.refs.current_ms, () => {
      this.update_on_time_change()
    })
  }

  sync_from_diff() {
    this.diffs[this.ref.diff_index.value] = toValue(this.diff.bound)
  }

  update_on_time_change() {
    this.diff.update()
  }

  create_diff() {
    let new_diff = Chart_diff.createDiff()
    new_diff.timing = this.diff.timing
    this.diffs.push(new_diff)
    this.diff_index = this.diffs.length - 1
  }

  add_diff(d: ChartTypeV2.diff) {
    d.notes = Chart_diff.validate_notes(d.notes)
    d.timing = Chart_diff.validate_timing(d.timing)
    this.diffs.push(d)
    this.diff_index = this.diffs.length - 1
    utils.refresh()
  }

  delete_diff() {
    if (this.diffs.length == 1)
      modal.ConfirmModal.show({
        msg: '这是最后一张谱面了。这样做会清空已有的note哦。要继续吗？<br>timing将会保留。'
      }).then(() => {
        this.diff.notes = []
      })
    else
      Charter.modal.ConfirmModal.show({ msg: '确定要删除这个diff吗……不能撤回哦。' }).then(() => {
        this.diffs.splice(this.diff_index, 1)
        this.diff_index = 0
        triggerRef(this.ref.diff_index)
        utils.refresh()
      })
  }

  bpm_of_time(time: ms) {
    return this.diff.bpm_of_time(time)
  }

  set_chart(v: ChartTypeV2.final) {
    this.song.set_song(v.song)
    this.diffs = v.diffs.map((x) => {
      let r = Chart_diff.createDiff()
      utils.shallow_assign(r, x)
      return r
    })
    // this.diff.set_diff(this.diffs[this.diff_index])
    this.diff_index = 0
    this.diff.set_diff(this.diffs[this.diff_index])
  }

  on_update() {
    this.audio.update()
  }

  async save() {
    if (this.audio.ele) {
      this.diff.floor_time()
      await nextFrame()
      this.diff.validate_chart()
      await nextFrame()
      Invoke('save-chart', this.id, JSON.stringify(this.chart))
      await nextFrame()
      Invoke(
        'update-chart-data',
        this.id,
        JSON.stringify({
          song: this.song.save(),
          diffs: this.diffs.map((x) => x.meta.diff1 + ' ' + x.meta.diff2)
        })
      ).then(() => {
        return GlobalStat.update_all_chart()
      })
    }
    return
  }

  write_current_vsc() {
    Invoke('write-vsc', this.id, this.diff.to_vsc().join('\n'), this.diff.diff1).then(() =>
      notify.success('已导出为vsc!!!!!!!')
    )
  }

  async export_chart(ext: 'svc' | 'zip') {
    const r = this.save()
    if (!r) return
    await r
    if (ext == 'svc') await Invoke('export-svc', this.id)
    else if (ext == 'zip') await Invoke('export-zip', this.id)
  }

  init_playfield() {
    this.playfield = new Chart_playfield(this)
  }

  handle_key(key: number) {
    this.playfield?.handle_keydown(key)
  }

  handle_keyup(key: number) {
    this.playfield?.handle_keyup(key)
  }

  async import_osz() {
    const r = await Invoke('read-osz')
    if (!r) return
    console.log(r)
    modal.LoadOszModal.show({ diff: r.diff, song: r.song })
  }

  import_osz_pics() {
    Invoke('import-osz-pics', this.id).then(() => {
      utils.refresh()
    })
  }
  async write_png() {
    const svg = document.getElementById('chart-preview-svg')
    if (!svg) return

    // 获取 SVG 尺寸
    const { width, height } = svg.getBoundingClientRect()

    // 创建 Canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法获取 Canvas 上下文')
    }

    // 设置白色背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // 克隆 SVG 元素以避免修改原元素
    const clonedSvg = svg.cloneNode(true) as SVGElement

    // 处理 SVG 中的 image 元素，将其转换为 data URL
    const imageElements = clonedSvg.querySelectorAll('image')
    const imagePromises: Promise<void>[] = []

    // 处理每个 image 元素
    imageElements.forEach((imgElement) => {
      const promise = new Promise<void>((resolve) => {
        const href = imgElement.getAttribute('href') || imgElement.getAttribute('xlink:href')
        if (!href) {
          resolve()
          return
        }

        // 如果是 data URL，直接使用
        if (href.startsWith('data:')) {
          resolve()
          return
        }

        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          try {
            // 创建临时 canvas 来转换图片
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = img.width
            tempCanvas.height = img.height

            const tempCtx = tempCanvas.getContext('2d')
            if (!tempCtx) {
              console.warn('无法创建临时 Canvas 上下文')
              resolve()
              return
            }

            tempCtx.drawImage(img, 0, 0)

            // 转换为 data URL
            const dataUrl = tempCanvas.toDataURL('image/png')

            // 更新 image 元素的 href
            if (imgElement.hasAttribute('xlink:href')) {
              imgElement.setAttribute('xlink:href', dataUrl)
            } else {
              imgElement.setAttribute('href', dataUrl)
            }

            resolve()
          } catch (error) {
            console.warn('图片转换失败:', error)
            resolve() // 即使失败也继续处理
          }
        }

        img.onerror = () => {
          console.warn('图片加载失败:', href)
          resolve()
        }

        img.src = href
      })

      imagePromises.push(promise)
    })

    // 等待所有图片处理完成
    await Promise.all(imagePromises)

    // 将 SVG 转换为数据 URL
    const svgString = new XMLSerializer().serializeToString(clonedSvg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    // 创建图片元素来加载 SVG
    const pngDataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        try {
          // 绘制到 Canvas
          ctx.drawImage(img, 0, 0, width, height)

          // 转换为 PNG data URL
          const pngData = canvas.toDataURL('image/png')

          // 清理 URL
          URL.revokeObjectURL(svgUrl)

          resolve(pngData)
        } catch (error) {
          URL.revokeObjectURL(svgUrl)
          reject(error)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl)
        reject(new Error('SVG 图片加载失败'))
      }

      img.src = svgUrl
    })

    // 调用主进程保存
    Invoke('export-preview-svg', this.id, pngDataUrl)
  }

  copy_diff() {
    const new_d = Chart_diff.createDiff()
    new_d.notes = this.diff.notes
    new_d.timing = this.diff.timing
    new_d.meta.charter = this.diff.charter
    // new_d.sv = this.diff.sv

    this.add_diff(new_d)
    notify.success('new diffed')
  }
}

// @ts-ignore
window.chart = Chart
