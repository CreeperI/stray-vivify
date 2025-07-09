import { ChartType, HandlerReturn } from '@preload/types'
import { notify } from '@renderer/core/notify'
import { computed, ComputedRef, ref, Ref, watch, WritableComputedRef } from 'vue'
import Translations from '@renderer/core/translations'
import { Charter } from '@renderer/core/charter'
import { utils } from '@renderer/core/utils'
import { Chart_audio } from '@renderer/core/chart/chart_audio'
import { Chart_song } from '@renderer/core/chart/chart_song'
import { Chart_diff } from './Chart_diff'
import { GlobalStat } from '@renderer/core/globalStat'

function isBumper(n: ChartType.note | string) {
  if (typeof n == 'string') return ['b', 's', 'mb'].includes(n)
  return ['b', 's', 'mb'].includes(n.n)
}

export type ms = number

export class Chart {
  static current: Chart | undefined = undefined
  static isBumper = isBumper
  song: Chart_song
  diffs: ChartType.Diff[]
  path: string
  audio: Chart_audio
  diff: Chart_diff
  length: number
  shown_timing: ComputedRef<[ms, ms]>
  current_bpm: WritableComputedRef<number>
  ref: {
    diff_index: Ref<number>
    diff: Ref<ChartType.Diff>
    chart_current_time: Ref<number>
  }
  canvas_data: {
    height: number
  }
  id: string

  constructor() {
    this.song = new Chart_song(this)
    this.diffs = [Chart_diff.createDiff()]
    this._diff_index = 0
    this.audio = new Chart_audio(this)
    this.path = ''
    this.length = -1
    this.canvas_data = {
      height: 0
    }
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
        const n = me.diff.notes.findLast((x) => {
          return x.n == 'p' && x.t <= me.audio.refs.current_ms.value
        })
        if (n) (n as ChartType.bpm_note).v = v
      }
    })
    this.ref = {
      diff_index: ref(0),
      diff: ref(this.diffs[0]),
      chart_current_time: ref(0)
    }
    this.diff = new Chart_diff(this)
    this.id = ''
  }

  _diff_index: number

  get diff_index() {
    return this._diff_index
  }

  set diff_index(v: number) {
    this.ref.diff_index.value = v
    this.ref.diff.value = this.diffs[this.ref.diff_index.value]
    this._diff_index = v
    Charter.update()
  }

  get visible_timing() {
    return this.audio.current_time + Charter.refs.visible.value
  }

  get chart(): ChartType.Chart {
    return {
      song: this.song.save(),
      diffs: this.diffs
    }
  }

  static createChart(n = ''): ChartType.Chart {
    return {
      song: {
        name: n,
        composer: '/a b30',
        bpm: '120'
      },
      diffs: [Chart_diff.createDiff()]
    }
  }

  static create(musicPath: string, musicURL: string, name: string): Promise<Chart> {
    const chart = new Chart()
    chart.audio.load_url(musicURL)
    chart.set_path(musicPath)
    chart.set_name(name)
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

  static create_vsb(vsb_path: string): Promise<Chart> {
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
  }

  static async open_chart(id: string) {
    Charter.record.mode.value = false
    Charter.state.value = 'cache'
    Charter.load_state.clear()
    Charter.load_state.data.value.asked_path = 'success'
    return this.open_chart_with_fp(id)
  }

  static async open_chart_with_fp(id: string) {
    const file = await Charter.invoke('open-song', id)
    Charter.load_state.data.value.load_music_from_backend = 'success'
    if (!file) {
      notify.error(Translations.notify.music_error)
      Charter.state.value = 'startUp'
      throw new Error('missing')
    }
    const blob_path = URL.createObjectURL(await this.fetch_blob(file.path))
    const chart = await this.create(id, blob_path, file.data.song.name)
    Charter.load_state.data.value.waiting_can_play = 'success'
    chart.set_chart(file.data)
    chart.id = id
    this.current = chart
    Charter.state.value = 'charting'
    watch(
      Charter.refs.state,
      () => {
        chart.audio.pause()
      },
      { once: true }
    )
  }

  static async fetch_blob(path: string) {
    const r = await fetch('stray:///' + path)
    if (r.ok) return await r.blob()
    throw new Error('what fetch failed')
  }

  load_vsb(r: HandlerReturn.readVsb) {
    if (!r) return
    Charter.modal.ConfirmModal.show({ msg: Translations.confirm.vsb }).then(() => {
      this.diff.set_notes(r)
      this.fuck_shown(true)
      this.diff.update_diff_counts()
    })
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

  post_define() {
    this.length = (this.audio.ele?.duration ?? -1) * 1000
    Charter.refs.current_name.value = this.song.name
    watch(
      this.ref.diff,
      () => {
        this.diffs[this.ref.diff_index.value] = this.ref.diff.value
      },
      { deep: true }
    )
    watch(this.ref.diff_index, () => {
      this.ref.diff.value = this.diffs[this.ref.diff_index.value]
      this.fuck_shown()
    })
    watch(this.audio.refs.current_ms, () => {
      this.fuck_shown()
      this.ref.chart_current_time.value = this.audio.refs.current_ms.value
    })
    setTimeout(() => {
      this.fuck_shown(true)
    }, 500)
  }

  create_diff() {
    this.diffs.push(Chart_diff.createDiff())
    this.diff_index = this.diffs.length - 1
  }

  delete_diff() {
    Charter.modal.ConfirmModal.show({ msg: Translations.confirm.del_diff }).then(() => {
      this.diffs.splice(this.diff_index, 1)
      this.diff_index = 0
    })
  }

  bpm_of_time(time: ms) {
    return this.diff.bpm_of_time(time)
  }

  set_chart(v: ChartType.Chart) {
    this.song.set_song(v.song)
    this.diffs = v.diffs
    // this.diff.set_diff(this.diffs[this.diff_index])
    this.diff_index = 0
  }

  on_update() {
    this.audio.update()
  }

  save() {
    if (this.audio.ele) {
      this.diff.floor_time()
      Charter.invoke('save-chart', this.id, JSON.stringify(this.chart))
      Charter.invoke(
        'update-chart-data',
        this.id,
        JSON.stringify({
          song: this.song.save(),
          diffs: this.diffs.map((x) => x.name + ' ' + x.hard)
        })
      ).then(() => {
        GlobalStat.update_all_chart()
      })
    }
  }

  write_current_vsc() {
    Charter.invoke('write-vsc', this.id, this.diff.to_vsc().join('\n'), this.diff.name).then(() =>
      notify.success('已导出为vsc!!!!!!!')
    )
  }

  drawCanvas() {
    const canvas = document.getElementById('charter-canvas') as HTMLCanvasElement
    if (canvas == undefined) {
      return
    }
    const context = canvas.getContext('2d')
    if (!context) return
    if (this.canvas_data.height == 0) {
      this.canvas_data.height = canvas.height = canvas.clientHeight
      context.textAlign = 'right'
      context.font = 25 + 'px Arial'
      context.textBaseline = 'bottom'
    }

    const height = this.canvas_data.height
    context.clearRect(0, 0, canvas.width, canvas.height)

    const current_time = this.audio.current_time
    const mul = Charter.refs.mul.value
    const visible_max = this.visible_timing
    const processT = (ms: number) => Math.floor(height - (ms - current_time) * mul)

    let time = this.diff.nearest(this.audio.current_time, false)
    let bpm = this.diff.bpm_of_time(time)?.bpm
    if (bpm == undefined) {
      bpm = 120
      context.fillStyle = '#ff0000'
    }
    let time_per_beat = this.diff.time_per_beat(bpm)
    context.fillStyle = '#8d8d8d'
    const bpm_list = this.diff.bpm_list.value
    let next_bpm_time = bpm_list.find((x) => x.time > time)?.time ?? visible_max
    let flag = true
    let times = 0

    if (Charter.record.mode.value && !Charter.record.show_bar_line.value) flag = false
    while (flag && times < 200) {
      while (time < next_bpm_time - Charter.settings.data.overlap_minimum) {
        context.fillRect(40, processT(time), 622, 6)
        time += time_per_beat
        times++
      }
      if (time > visible_max) break

      time = next_bpm_time
      bpm = this.diff.bpm_of_list(time, bpm_list).bpm
      time_per_beat = this.diff.time_per_beat(bpm)
      next_bpm_time = bpm_list.find((x) => x.time > time)?.time ?? visible_max
    }
    context.fillStyle = '#b8dcee'

    if (Charter.record.mode.value && !Charter.record.show_bar_count.value) return

    const visible_duration = this.shown_timing.value
    this.diff.bar_list.value
      .map((val, idx) => {
        return {
          t: val,
          ix: idx
        }
      })
      .filter((x) => utils.between(x.t, visible_duration))
      .map((v) => {
        context.fillText((v.ix + 1).toString(), 36, processT(v.t) + 15, 40)
        // context.fillRect(0, processT(val) - 5, 40, 6)
      })
  }

  /*drawCanvas() {
    const canvas = document.getElementById('charter-canvas') as HTMLCanvasElement
    if (canvas == undefined) {
      return
    }
    if (!this.canvas_data.height) {
      this.canvas_data.height = canvas.height = canvas.clientHeight
    }
    const canvas_height = this.canvas_data.height
    const context = canvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    const current_time = this.audio.current_time
    Charter.timer.timer('draw-canvas')

    const processT = (ms: number) => {
      const y = (ms - current_time) * Charter.refs.mul.value
      return Math.floor(canvas_height * (1 - y / canvas_height))
    }
    Charter.prevent_loop.fuck_timer('draw_canvas')

    const offset = this.diff.offset

    // chart time = audio time - offset, for +offset will push notes later, - for earlier
    const chart_time = this.chart_time

    const visible_max = this.visible_timing

    let time = this.diff.nearest(chart_time, false)
    let _bpm = this.diff.bpm_of_time(chart_time)?.bpm
    context.fillStyle = utils.random(["#114514", "#1ff00f","#ff00ff","#f0ff0f"])
    if (_bpm == undefined) {
      _bpm = 120
      context.fillStyle = '#ff0000'
    }
    const data = {
      // refers to chart time
      time: chart_time,
      time_per_beat: 0,
      next_bpm_time: 0,
      next_end_time: 0,
      bpm: _bpm,
    }

    data.time_per_beat = this.diff.time_per_beat(_bpm)
    data.next_bpm_time = this.diff.bpm_list().find((x) => x.time > time)?.time ?? -1

    data.next_end_time =
      data.next_bpm_time == -1
        ? this.visible_timing_ref.value[1] + time
        : Math.min(data.next_bpm_time, this.visible_timing_ref.value[1])
    let flag = true
    let loops = 0

    if (Charter.record.mode.value && !Charter.record.show_bar_line.value) flag = false
    while (flag && loops < 200) {
      while (data.time <= data.next_end_time) {
        if (data.time >= 0) {
          context.fillRect(40, processT(data.time), 622, 6)
        }
        data.time += data.time_per_beat
        Charter.prevent_loop.timer("draw_canvas",150)
      }
      if (data.time > visible_max) break

      data.bpm = this.diff.bpm_of_time(time)?.bpm ?? _bpm
      data.time = data.next_end_time
      data.time_per_beat = this.diff.time_per_beat(_bpm)
      data.next_bpm_time =
        this.diff.bpm_list().find((x) => x.time > time)?.time ?? this.visible_timing
      data.next_end_time = Math.min(data.next_bpm_time, this.visible_timing)
    }
    context.fillStyle = '#b8dcee'
    context.textAlign = 'right'
    context.font = 25 + 'px Arial'
    context.textBaseline = 'bottom'
    if (Charter.record.mode.value && !Charter.record.show_bar_count.value) return

    this.diff
      .bar_list(this.length)
      .map((val, idx) => {
        return {
          t: val,
          ix: idx
        }
      })
      .filter((x) => utils.between(x.t, this.visible_timing_ref.value))
      .map((v) => {
        context.fillText((v.ix + 1).toString(), 36, processT(v.t) + 15, 40)
        // context.fillRect(0, processT(val) - 5, 40, 6)
      })
  }*/
}

// @ts-ignore
window.chart = Chart
