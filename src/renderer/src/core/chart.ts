import { ChartType, HandlerReturn } from '@preload/types'
import { notify } from '@renderer/core/notify'
import { computed, ComputedRef, ref, Ref, ToRefs, watch, WritableComputedRef } from 'vue'
import Translations from '@renderer/core/translations'
import Storage from '@renderer/core/storage'
import { Charter } from '@renderer/core/charter'
import { Lazy, utils } from '@renderer/core/utils'

function isBumper(n: ChartType.note | string) {
  if (typeof n == 'string') return ['b', 's', 'mb'].includes(n)
  return ['b', 's', 'mb'].includes(n.n)
}

type ms = number
type second = number

class Chart_audio {
  chart: Chart
  file_path: string | undefined
  url: string | undefined
  ele: undefined | HTMLAudioElement
  refs: {
    current_ms: Ref<ms>
    play_rate: Ref<number>
    writable_current_ms: WritableComputedRef<ms>
    writable_play_rate: WritableComputedRef<number>
    writable_current_second: WritableComputedRef<second>
  }

  constructor(ch: Chart, file_path?: string, url?: string) {
    this.chart = ch
    this.file_path = file_path
    this.url = url
    this._volume = Charter.settings.data.volume
    this.ele = undefined
    if (url) {
      this.ele = new Audio(url)
    }
    this._play_rate = 1
    this._current_time = 0

    const me = this
    this.refs = {
      current_ms: ref(0),
      play_rate: ref(1),
      writable_current_ms: computed({
        get() {
          return me.refs.current_ms.value
        },
        set(v) {
          me.current_time = v
        }
      }),
      writable_current_second: computed({
        get() {
          return me.refs.current_ms.value / 1000
        },
        set(v) {
          me.current_time = v * 1000
        }
      }),
      writable_play_rate: computed({
        get() {
          return me.refs.play_rate.value
        },
        set(v) {
          me.play_rate = v
        }
      })
    }
  }

  _volume: number

  get volume() {
    return this._volume
  }

  set volume(v: number) {
    this._volume = v
    if (this.ele) this.ele.volume = v
  }

  _play_rate: number

  get play_rate() {
    return this._play_rate
  }

  set play_rate(v: number) {
    this._play_rate = v
    this.refs.play_rate.value = v
    if (this.ele) this.ele.playbackRate = v
  }

  _current_time: ms

  get current_time(): ms {
    return this._current_time
  }

  set current_time(v: ms) {
    this.pause()
    v = Math.max(0, v)
    this._current_time = v
    this.refs.current_ms.value = v
    if (this.ele) this.ele.currentTime = v / 1000
  }

  get paused() {
    return this.ele?.paused
  }

  set_current_time_no_ele(v: ms) {
    v = Math.max(0, v)
    this._current_time = v
    this.refs.current_ms.value = v
  }

  on_can_play_through(cb: () => void, options?: AddEventListenerOptions) {
    if (this.ele) this.ele.addEventListener('canplaythrough', cb, options)
    else console.warn('Trying to setting can-play-through callback on a empty audio!')
  }

  load_url(url: string) {
    this.ele = new Audio(url)
  }

  pause() {
    this.ele?.pause()
  }

  play_pause() {
    if (this.ele) {
      if (this.ele.paused) this.ele.play()
      else this.ele?.pause()
    }
  }

  update() {
    if (this.ele) {
      this.set_current_time_no_ele(this.ele.currentTime * 1000)
    }
  }
}

class Chart_song {
  refs: ToRefs<ChartType.Song>

  constructor(name?: string, composer?: string, bpm?: string) {
    this._name = ''
    this._composer = ''
    this._bpm = '120'
    if (name) this._name = name
    if (composer) this._composer = composer
    if (bpm) this._bpm = bpm
    this.refs = {
      name: ref(this._name),
      composer: ref(this._composer),
      bpm: ref(this._bpm)
    }

    watch(this.refs.name, (v) => (this._name = v))
    watch(this.refs.composer, (v) => (this._composer = v))
    watch(this.refs.bpm, (v) => (this._bpm = v))
  }

  _name: string

  get name() {
    return this._name
  }

  set name(v: string) {
    this._name = v
  }

  _composer: string

  get composer() {
    return this._composer
  }

  set composer(v: string) {
    this._composer = v
  }

  _bpm: string

  get bpm() {
    return this._bpm
  }

  set bpm(v: string) {
    this._bpm = v
  }

  static createSong(): ChartType.Song {
    return {
      name: 'Termiant',
      composer: 'Astella vs Estral.tf',
      bpm: '114'
    }
  }

  set_song(v: ChartType.Song) {
    this.name = v.name
    this.composer = v.composer
    this.bpm = v.bpm
  }

  save(): ChartType.Song {
    return {
      name: this.name,
      composer: this.composer,
      bpm: this.bpm
    }
  }
}

class Chart_diff {
  bound: Ref<ChartType.Diff>
  chart: Chart
  counts: Ref<{
    chip: number
    bpm: number
    hold: number
    bomb: number
    sBumper: number
    bBumper: number
    bumper: number
    total: number
    avg_density: number
  }>
  undo: (() => void)[]
  redo: (() => void)[]
  shown: Ref<ChartType.note[]>
  last_update: number
  bpm_list: Lazy<ChartType.bpm_part[]>
  bar_list: Lazy<ms[]>

  constructor(chart: Chart) {
    this.bound = chart.ref.diff
    this.chart = chart
    this.counts = ref({
      chip: 0,
      bpm: 0,
      hold: 0,
      bomb: 0,
      sBumper: 0,
      bBumper: 0,
      bumper: 0,
      total: 0,
      avg_density: 0
    })
    watch(this.bound, () => this.update_diff_counts())
    this.undo = []
    this.redo = []
    this.shown = ref([])
    this.last_update = 0
    this.bpm_list = new Lazy(() => {
      return this.notes
        .filter((x) => x.n == 'p')
        .toSorted((a, b) => a.t - b.t)
        .map((x) => {
          return {
            time: x.t,
            bpm: x.v
          }
        })
    })
    this.bar_list = new Lazy(() => {
      const bpm_list = this.bpm_list.value
      const times: ms[] = []
      let time = 0
      for (let i = 0; i < bpm_list.length; i++) {
        const part = bpm_list[i]
        const time_per_bar = (60 / part.bpm) * 4 * 1000
        if (i == bpm_list.length - 1) {
          const part_end = Math.min(chart.length, 114514)
          for (let j = 0; time < part_end; j++) {
            times.push(time)
            time += time_per_bar
          }
        } else {
          const part_end = bpm_list[i + 1].time
          for (let j = 0; time < part_end; j++) {
            times.push(time)
            time += time_per_bar
          }
        }
      }
      return times
    })
  }

  get notes() {
    return this.bound.value.notes
  }

  set notes(v: ChartType.note[]) {
    this.bound.value.notes = v
  }

  get name() {
    return this.bound.value.name
  }

  set name(v: string) {
    this.bound.value.name = v
  }

  get hard() {
    return this.bound.value.hard
  }

  set hard(v: string) {
    this.bound.value.hard = v
  }

  get charter() {
    return this.bound.value.charter
  }

  set charter(v: string) {
    this.bound.value.charter = v
  }

  get offset() {
    return this.bound.value.offset
  }

  set offset(v: number) {
    this.bound.value.offset = v
  }

  static createDiff(): ChartType.Diff {
    return {
      name: 'Finale',
      hard: '14+',
      notes: [{ n: 'p', t: 0, l: 0, v: 120 }],
      charter: 'Terminal Flow',
      offset: 0
    }
  }

  update_diff_counts() {
    const v = this.bound.value
    this.counts.value.chip = v.notes.filter((x) => x.n == 'n').length
    this.counts.value.bpm = v.notes.filter((x) => x.n == 'p').length - 1
    this.counts.value.hold = v.notes.filter((x) => x.n == 'h').length
    this.counts.value.bomb = v.notes.filter((x) => x.n == 'm').length
    this.counts.value.sBumper = v.notes.filter((x) => x.n == 's').length
    this.counts.value.bBumper = v.notes.filter((x) => x.n == 'mb').length
    this.counts.value.bumper = v.notes.filter((x) => x.n == 'b').length
    this.counts.value.total = v.notes.length - this.counts.value.bpm - 1
    this.counts.value.avg_density = this.counts.value.total / (this.chart.length / 1000)
  }

  set_notes(v: ChartType.note[]) {
    this.notes = v
    Charter.update()
  }

  set_diff(v: ChartType.Diff) {
    this.name = v.name
    this.charter = v.charter
    this.hard = v.hard
    this.offset = v.offset
    this.set_notes(v.notes)
    return this
  }

  save(): ChartType.Diff {
    this.sort()
    return {
      name: this.name,
      hard: this.hard,
      notes: this.notes,
      charter: this.charter,
      offset: this.offset
    }
  }

  bind(v: Ref<ChartType.Diff>) {
    this.bound = v
    watch(v, (r) => {
      this.set_diff(r)
    })
  }

  sort() {
    this.notes.sort(utils.sort_notes)
    this.notes.forEach((x) => (x.t = Math.floor(x.t)))
    return this.notes
  }

  to_sorted() {
    return this.notes.toSorted(utils.sort_notes)
  }

  add_bpm(v: ChartType.note) {
    const r = this.add_note_no_undo(v)
    this.bpm_change()
    return r
  }

  bpm_change() {
    this.bpm_list.invalidate()
  }

  remove_bpm(v: ChartType.note) {
    const r = this.remove_note_no_undo(v)
    this.bpm_change()
    return r
  }

  add_note(v: ChartType.note) {
    const r = this.add_note_no_undo(v)
    if (r)
      this.push_undo(() => {
        this.undo_add(v)
      })
    return r
  }

  remove_note(v: ChartType.note) {
    const r = this.remove_note_no_undo(v)
    if (r)
      this.push_undo(() => {
        this.undo_remove(v)
      })
    Charter.update()
  }

  undo_add(v: ChartType.note) {
    this.remove_note_no_undo(v)
    this.push_redo(() => {
      this.redo_add(v)
    })
  }

  undo_remove(v: ChartType.note) {
    this.add_note_no_undo(v)
    this.push_redo(() => {
      this.redo_remove(v)
    })
  }

  redo_add(v: ChartType.note) {
    this.add_note(v)
  }

  redo_remove(v: ChartType.note) {
    this.remove_note(v)
  }

  remove_note_no_undo(v: ChartType.note) {
    if (!this.notes.includes(v)) return false
    this.notes.splice(this.notes.indexOf(v), 1)
    utils.remove(this.shown.value, v)
    Charter.update()
    return true
  }

  add_note_no_undo(v: ChartType.note) {
    v.t = Math.floor(v.t)
    const overlap = Charter.settings.data.overlap_minimum
    const wrapped = this.shown.value.find((x) => {
      if (x.n == 'h') {
        if (x.l != v.l) return false
        else return utils.between(v.t, [x.t - overlap, x.t + x.h + overlap])
      }
      return utils.around(x.t, v.t, overlap) && x.l == v.l
    })
    if (wrapped) return false
    this.notes.push(v)
    this.shown.value.push(v)
    Charter.update()
    return true
  }

  del_note(v: ChartType.note) {
    this.remove_note(v)
  }

  nearest(t: ms, round = true): ms {
    if (t <= 0) t = 0
    const bpm = this.bpm_of_time(t)
    if (!bpm) throw new Error('No bpm found???')
    const passed = t - bpm.time
    const per_beat = this.time_per_beat(bpm.bpm)
    if (round) return Math.round(passed / per_beat) * per_beat + bpm.time
    else return Math.floor(passed / per_beat) * per_beat + bpm.time
  }

  bpm_of_time(time: ms) {
    if (time <= 0) time = 0
    return this.bpm_list.value.findLast((v) => v.time <= time)
  }

  bpm_of_list(time: ms, list: ChartType.bpm_part[]) {
    if (time <= 0) time = 0
    return list.findLast((v) => v.time <= time)
  }

  time_per_beat(bpm: number): ms {
    const meter = Charter.settings.data.meter
    return (60 / bpm) * (4 / meter) * 1000
  }

  push_undo(fn: () => void) {
    this.undo.push(fn)
    while (this.undo.length >= 20) this.undo.shift()
  }

  execute_undo() {
    const fn = this.undo.pop()
    if (fn) fn()
  }

  push_redo(fn: () => void) {
    this.redo.push(fn)
    while (this.redo.length >= 20) this.redo.shift()
  }

  execute_redo() {
    const fn = this.redo.pop()
    if (fn) fn()
  }

  floor_time() {
    this.notes.forEach((x) => (x.t = Math.floor(x.t)))
  }

  fuck_shown(t: number, force = false) {
    if (force ? false : Math.abs(t - this.last_update) < 2500) return
    Charter.timer.timer('fuck_shown')
    this.shown.value = this.notes.filter((x) => {
      return this.isVisible(x, [t - 3000 - this.offset, t + 3000])
    })
    this.last_update = t
  }

  isVisible(n: ChartType.note, visible: [number, number]): boolean {
    if (n.n == 'h') {
      if (utils.between(n.t, visible)) return true
      return n.t + n.h < visible[1]
    }
    return utils.between(n.t, visible)
  }
}

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

  constructor() {
    this.song = new Chart_song()
    this.diffs = [Chart_diff.createDiff()]
    this._diff_index = 0
    this.audio = new Chart_audio(this)
    this.path = ''
    this.length = -1
    this.canvas_data = {
      height: 0
    }
    this.shown_timing = computed(() => [
      this.audio.refs.current_ms.value - this.diff.offset - 3000,
      this.audio.refs.current_ms.value - this.diff.offset + 3000 + Charter.refs.visible.value
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
    return this.chart_time + Charter.refs.visible.value
  }

  get chart_time() {
    return this.audio.current_time - this.diff.offset
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
      Charter.invoke.read_vsb(vsb_path).then((r) => {
        if (!r) {
          reject('')
          return
        }
        chart.diff.set_notes(r)
        resolve(chart)
      })
    })
  }

  static async open_chart(fp?: string) {
    Charter.record.mode.value = false
    Charter.state.value = 'cache'
    Charter.load_state.clear()
    if (!fp) {
      const path = await Charter.invoke.ask_song()
      if (!path) {
        Charter.load_state.data.value.asked_path = 'failed'
        throw new Error('rejected asking')
      }
      return this.open_chart_with_fp(path.path)
    }
    Charter.load_state.data.value.asked_path = 'success'
    return this.open_chart_with_fp(fp)
  }

  static async open_chart_with_fp(fp: string) {
    const file = await Charter.invoke.open_chart(fp)
    Charter.load_state.data.value.load_music_from_backend = 'success'
    if (file.state == 'missing') {
      notify.error(Translations.notify.music_error)
      Storage.remove_proj(fp)
      Charter.state.value = 'startUp'
      throw new Error('missing')
    }
    const blob = new Blob([file.buf], { type: 'audio/*' })
    const url = URL.createObjectURL(blob)
    Charter.load_state.data.value.create_music_blob = 'success'
    const chart = await this.create(fp, url, file.name)
    Charter.load_state.data.value.waiting_can_play = 'success'
    if (file.state == 'success') chart.set_chart(file.chart)
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

  load_vsb(r: HandlerReturn.readVsb) {
    if (!r) return
    Charter.modal.ConfirmModal.show({ msg: Translations.confirm.vsb }).then(() => {
      this.diff.set_notes(r)
      this.fuck_shown(true)
      this.diff.update_diff_counts()
    })
  }

  fuck_shown(force = false) {
    this.diff.fuck_shown(this.chart_time, force)
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
    watch(
      () => this.ref.diff.value.offset,
      () => this.drawCanvas()
    )
    watch(this.ref.diff_index, () => {
      this.ref.diff.value = this.diffs[this.ref.diff_index.value]
      this.fuck_shown()
    })
    watch(this.audio.refs.current_ms, () => {
      this.fuck_shown()
      this.ref.chart_current_time.value = this.audio.refs.current_ms.value - this.diff.offset
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
      Storage.add_proj(this.path, this.song.name)
      this.diff.floor_time()
      Charter.invoke
        .save_chart(
          {
            song: this.song.save(),
            diffs: this.diffs
          },
          this.path
        )
        .then(() => {})
    }
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
    const offset = this.diff.offset
    const mul = Charter.refs.mul.value
    const visible_max = this.visible_timing
    const processT = (ms: number) => Math.floor(height - (ms - current_time + offset) * mul)

    let time = this.diff.nearest(this.audio.current_time - offset, false)
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
      bpm = this.diff.bpm_of_list(time, bpm_list)?.bpm ?? bpm
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
