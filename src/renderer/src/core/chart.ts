import { ChartType, HandlerReturn } from '@preload/types'
import { notify } from '@renderer/core/notify'
import { computed, ComputedRef, ref, Ref, ToRefs, watch, WritableComputedRef } from 'vue'
import Translations from '@renderer/core/translations'
import Storage from '@renderer/core/storage'
import { Charter } from '@renderer/core/charter'
import { utils } from '@renderer/core/utils'

function isBumper(n: ChartType.note | string) {
  if (typeof n == 'string') return ['b', 's', 'mb'].includes(n)
  return ['b', 's', 'mb'].includes(n.n)
}

type ms = number
type second = number

/*
export class Chart {
  static isBumper = isBumper
  static current: Chart | undefined = undefined
  diff: Ref<ChartType.Diff>
  audio: HTMLAudioElement
  fp: string
  // milli
  length: number
  name: string
  diff_index: Ref<number>
  play_rate_ref: WritableComputedRef<number>
  currentBpm: WritableComputedRef<number>
  currentTimeRef: WritableComputedRef<number>
  bpm_list: ComputedRef<Bpm_part[]>
  visibleTiming: ComputedRef<[number, number]>

  private current_time: Ref<number>
  private play_rate: Ref<number>
  private readonly chart: ChartType.Chart

  constructor(musicPath: string, musicURL: string, name: string) {
    const me = this
    this.chart = Chart.createChart(name)
    this.audio = new Audio(musicURL)
    this.audio.volume = Charter.settings.data.volume / 100
    this.length = 0
    this.fp = musicPath
    this.name = name
    document.title = name
    this.diff_index = ref(0)
    this.diff = ref(this.chart.diffs[this.diff_index.value])
    this.current_time = ref(0)
    this.play_rate_ref = computed({
      get() {
        return me.play_rate.value
      },
      set(v) {
        me.play_back_rate = v
      }
    })
    this.play_rate = ref(1)
    this.bpm_list = computed(() => [{ time: 0, bpm: 0, len: 0 }])
    this.visibleTiming = computed(() => [
      this.current_time.value * 1000 - 2000,
      this.current_time.value * 1000 + ui.windowHeight.value / ui.mul.value + 2000
    ])
    this.currentTimeRef = computed({
      get() {
        return me.current_time.value
      },
      set(val) {
        me.currentTime = val
      }
    })

    this.currentBpm = computed({
      get() {
        return me.bpm_of_time(me.current_time.value * 1000)
      },
      set(v: number) {
        const a = me.diff.value.notes.findLast((x) => {
          return x.n == 'p' ? x.t <= me.current_time.value * 1000 : false
        }) as ChartType.bpm_note | undefined
        if (a) a.v = v
      }
    })

    this.audio.addEventListener('ended', () => {
      this.currentTime = 0
    })
  }

  static get send() {
    return send
  }

  get currentTime() {
    return this.audio.currentTime
  }

  set currentTime(v: number) {
    this.audio.currentTime = Math.max(0, v)
  }

  get play_back_rate() {
    return this.audio.playbackRate
  }

  set play_back_rate(v: number) {
    this.audio.playbackRate = v
    this.play_rate.value = v
  }

  get song() {
    return this.chart.song
  }

  get diffs() {
    return this.chart.diffs
  }

  // n: name
  static createChart(n = ''): ChartType.Chart {
    return {
      song: {
        name: n,
        composer: '/a b30',
        bpm: 120
      },
      diffs: [this.createDiff()]
    }
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

  static part_to_note(p: Bpm_part): ChartType.bpm_note {
    return {
      n: 'p',
      t: p.time,
      l: 0,
      v: p.bpm
    }
  }


  post_define() {
    const length = this.audio.duration * 1000
    this.length = length
    this.bpm_list = computed(() => {
      const notes = this.diff.value.notes.filter((x) => x.n == 'p').sort((a, b) => a.t - b.t)
      const x: Bpm_part[] = []
      for (let i = 0; i < notes.length; i++) {
        const pt: Bpm_part = {
          time: notes[i].t,
          bpm: notes[i].v,
          len: length - notes[i].t
        }
        if (x[i - 1]) x[i - 1].len = pt.time - x[i - 1].time
        x.push(pt)
      }
      return x
    })
    this.watchers()
    // me.diff.value = data2notes(me.chart[me.diff_index.value].notes, me.length)
    // watch(me.diff_index, (v) => {
    //   me.diff.value = data2notes(me.chart[v].notes, me.length)
    // })
  }

  watchers() {
    watch(
      this.diff,
      () => {
        this.chart[this.diff_index.value] = this.diff.value
      },
      { deep: true }
    )
    watch(this.diff_index, (v) => {
      this.diff.value = this.chart.diffs[v]
    })
  }

  save() {
    sort_diff(this.diff.value)
    ui.invoke('save-chart', this.fp, JSON.stringify(this.chart))
    Storage.add_proj(this.fp, this.song.name)
  }

  createDiff() {
    this.chart.diffs.push(Chart.createDiff())
    this.diff_index.value += 1
    ui.refresh()
  }

  deleteDiff() {
    if (this.chart.diffs.length == 1) return
    if (confirm(Translations.confirm.del_diff)) this.diffs.splice(this.diff_index.value, 1)
    this.diff_index.value = Math.max(0, this.diff_index.value - 1)
    ui.refresh()
  }

  read_vsb() {
    ui.invoke('ask-vsb')
      .then((r) => {
        if (!r) return
        return ui.invoke('read-vsb', r.path)
      })
      .then((r) => {
        if (!r) return
        modal.ConfirmModal.show({ msg: Translations.confirm.vsb }).then(() => {
          this.diff.value.notes = r
        })
      })
  }

  // true if valid
  valid_check(pending: ChartType.note, unset_hold: boolean = false) {
    if (pending.l < 0 || pending.l > 3) return false
    const minimum = Charter.settings.data.overlap_minimum
    return (
      this.diff.value.notes.find((note) => {
        // for bpm notes, simply check if their time are same
        if (note.n == 'p' && pending.n == 'p') {
          return note.t == pending.t
        }
        if (note.n == 'p' || pending.n == 'p') return false
        if (note.l == pending.l) {
          // specially, when setting a newborn hold, t and l are the same
          if (note.n == 'h' && pending.n == 'h' && unset_hold) return false
          if (note.t == pending.t) return true
          if (Math.abs(note.t - pending.t) < minimum) return true

          // 1 check if they're hold and fuck their length (start->end) to assure no overlapping
          if (isBumper(pending)) {
            return false
          }
          if (note.n == 'h')
            return utils.between(pending.t, [note.t - minimum, note.t + note.h + minimum])
          if (pending.n == 'h')
            return utils.between(note.t, [pending.t - minimum, pending.t + pending.h + minimum])
          // check if in certain ms
        }
        if (note.t == pending.t) {
          // 2 check for bumper's overlap
          if (isBumper(note)) return pending.l == note.l || pending.l == note.l + 1
          if (isBumper(pending)) return note.l == pending.l || note.l == pending.l + 1
        }

        return false
      }) == undefined
    )
  }

  bpm_of_time(t: number) {
    const bpm_list = this.bpm_list.value
    for (let i = bpm_list.length - 1; i >= 0; i--) {
      if (t >= bpm_list[i].time) return bpm_list[i].bpm
    }
    throw new Error('null Bpm-part.')
  }

  on_update() {
    this.current_time.value = this.audio.currentTime
    this.play_rate.value = this.audio.playbackRate
  }

  set_chart(ch: ChartType.Chart) {
    utils.assign(this.chart.song, ch.song)
    this.chart.diffs = []
    for (let i = 0; i < ch.diffs.length; i++) {
      const diff = ch.diffs[i]
      this.chart.diffs.push({
        name: diff.name ?? 'Finale',
        hard: diff.hard ?? '14+',
        notes: diff.notes ?? [{ n: 'p', t: 0, l: 0, v: 120 }],
        charter: diff.charter ?? '',
        offset: diff.offset ?? 0
      })
    }
    this.diff_index.value = 0
    this.diff.value = this.chart.diffs[0]
  }
}*/

class Chart_audio {
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

  constructor(file_path?: string, url?: string) {
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

  on_can_play_through(cb: () => void) {
    if (this.ele) this.ele.addEventListener('canplaythrough', cb)
    else console.warn('Trying to setting can-play-through callback on a empty audio!')
  }

  load_url(url: string) {
    this.ele = new Audio(url)
    this.current_time = 0
    this.play_rate = 1
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

  constructor(chart: _chart) {
    this.bound = chart.ref.diff
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
    watch(this.bound, (v) => {
      this.counts.value.chip = v.notes.filter((x) => x.n == 'n').length
      this.counts.value.bpm = v.notes.filter((x) => x.n == 'p').length - 1
      this.counts.value.hold = v.notes.filter((x) => x.n == 'h').length
      this.counts.value.bomb = v.notes.filter((x) => x.n == 'm').length
      this.counts.value.sBumper = v.notes.filter((x) => x.n == 's').length
      this.counts.value.bBumper = v.notes.filter((x) => x.n == 'mb').length
      this.counts.value.bumper = v.notes.filter((x) => x.n == 'b').length
      this.counts.value.total = v.notes.length - this.counts.value.bpm - 1
      this.counts.value.avg_density = this.counts.value.total / (chart.length / 1000)
    })
    this.undo = []
    this.redo = []
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

  bpm_list(): ChartType.bpm_part[] {
    return this.notes
      .filter((x) => x.n == 'p')
      .toSorted((a, b) => a.t - b.t)
      .map((x) => {
        return {
          time: x.t,
          bpm: x.v
        }
      })
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
    Charter.update()
    return true
  }

  add_note_no_undo(v: ChartType.note) {
    v.t = Math.floor(v.t)
    const same = this.notes.find(
      (x) => utils.around(x.t, v.t, Charter.settings.data.overlap_minimum) && x.l == v.l
    )
    if (same) return false
    this.notes.push(v)
    Charter.update()
    return true
  }

  del_note(v: ChartType.note) {
    this.remove_note(v)
  }

  nearest(t: ms, round = true): ms {
    const bpm = this.bpm_of_time(t)
    if (!bpm) throw new Error('No bpm found???')
    const passed = t - bpm.time
    const per_beat = this.time_per_beat(bpm.bpm)
    if (round) return Math.round(passed / per_beat) * per_beat + bpm.time
    else return Math.floor(passed / per_beat) * per_beat + bpm.time
  }

  bpm_of_time(time: ms) {
    return this.bpm_list().findLast((v) => v.time <= time)
  }

  time_per_beat(bpm: number) {
    const meter = Charter.settings.data.meter
    return (60 / bpm) * (4 / meter) * 1000
  }

  bar_list(end?: ms) {
    const bpm_list = this.bpm_list()
    const times: ms[] = []
    let time = 0
    for (let i = 0; i < bpm_list.length; i++) {
      const part = bpm_list[i]
      const time_per_bar = (60 / part.bpm) * 4 * 1000
      if (i == bpm_list.length - 1) {
        const part_end = end ?? part.time + 10000
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
}

export class _chart {
  static current: _chart | undefined = undefined
  static isBumper = isBumper
  song: Chart_song
  diffs: ChartType.Diff[]
  path: string
  audio: Chart_audio
  diff: Chart_diff
  length: number
  visible_timing: ComputedRef<[ms, ms]>
  current_bpm: WritableComputedRef<number>
  ref: {
    diff_index: Ref<number>
    diff: Ref<ChartType.Diff>
  }

  constructor() {
    this.song = new Chart_song()
    this.diffs = [Chart_diff.createDiff()]
    this._diff_index = 0
    this.audio = new Chart_audio()
    this.path = ''
    this.length = -1
    this.visible_timing = computed(() => [
      this.audio.refs.current_ms.value - 1000,
      this.audio.refs.current_ms.value + 2000 + Charter.refs.visible.value
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
      diff: ref(this.diffs[0])
    }
    this.diff = new Chart_diff(this)
    watch(
      this.ref.diff,
      () => {
        this.diffs[this.ref.diff_index.value] = this.ref.diff.value
      },
      { deep: true }
    )
    watch(this.ref.diff_index, () => {
      this.ref.diff.value = this.diffs[this.ref.diff_index.value]
    })
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

  static create(musicPath: string, musicURL: string, name: string): Promise<_chart> {
    const chart = new _chart()
    chart.audio.load_url(musicURL)
    chart.set_path(musicPath)
    chart.set_name(name)
    return new Promise((resolve) => {
      chart.audio.on_can_play_through(() => {
        chart.post_define()
        resolve(chart)
      })
    })
  }

  static create_vsb(vsb_path: string): Promise<_chart> {
    const chart = new _chart()
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

  /*static async open_chart(fp?: string) {
    function cb(file: HandlerReturn.askPath, ch: HandlerReturn.OpenChart) {
      if (!file) return
      if (ch.state == 'missing') {
        notify.error(Translations.notify.music_error)
        Storage.remove_proj(file.path)
        return
      }
      const blob = new Blob([ch.buf], { type: 'audio/!*' })
      const url = URL.createObjectURL(blob)

      _chart.create(file.path, url, file.name).then((chart) => {
        _chart.current = chart
        if (ch.state == 'success') chart.set_chart(ch.chart)
        Charter.state.value = 'charting'
      })
    }

    if (!fp)
      Charter.invoke.ask_song().then((file) => {
        if (!file) return
        Charter.invoke.open_chart(file.path).then((ch) => {
          cb(file, ch)
        })
      })
    else {
      Charter.invoke.open_exist_chart(fp).then((r) => {
        debugger
        if (r.state == 'missing') {
          notify.error(Translations.notify.music_error)
          Storage.remove_proj(fp)
          return
        }
        cb(r, r)
      })
    }
  }*/

  static async open_chart(fp?: string) {
    Charter.record.mode.value = false
    Charter.state.value = 'cache'
    if (!fp) {
      const path = await Charter.invoke.ask_song()
      if (!path) throw new Error('rejected asking')
      return this.open_chart_with_fp(path.path)
    }
    return this.open_chart_with_fp(fp)
  }

  static async open_chart_with_fp(fp: string) {
    const file = await Charter.invoke.open_chart(fp)
    if (file.state == 'missing') {
      notify.error(Translations.notify.music_error)
      Storage.remove_proj(fp)
      Charter.state.value = 'startUp'
      throw new Error('missing')
    }
    const blob = new Blob([file.buf], { type: 'audio/*' })
    const url = URL.createObjectURL(blob)
    const chart = await this.create(fp, url, file.name)
    if (file.state == 'success') chart.set_chart(file.chart)
    this.current = chart
    Charter.state.value = 'charting'
  }

  load_vsb(r: HandlerReturn.readVsb) {
    if (!r) return
    Charter.modal.ConfirmModal.show({ msg: Translations.confirm.vsb }).then(() => {
      this.diff.set_notes(r)
    })
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
    canvas.height = canvas.clientHeight
    const context = canvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    const processY = (y: number) => canvas.height * (1 - y / canvas.clientHeight)

    const processT = (ms: number) =>
      Math.floor(processY((ms - this.audio.current_time) * Charter.refs.mul.value))

    let time = this.diff.nearest(this.audio.current_time, false)
    let bpm = this.diff.bpm_of_time(time)?.bpm
    if (bpm == undefined) bpm = 120
    let time_per_beat = this.diff.time_per_beat(bpm)
    context.fillStyle = '#8d8d8d'
    let next_bpm_time =
      this.diff.bpm_list().find((x) => x.time > time)?.time ?? time + this.visible_timing.value[1]
    let flag = true
    let times = 0

    if (Charter.record.mode.value && !Charter.record.show_bar_line.value) flag = false
    while (flag && times < 200) {
      while (time < next_bpm_time - Charter.settings.data.overlap_minimum) {
        context.fillRect(40, processT(time), 622, 6)
        time += time_per_beat
        times++
      }
      if (utils.around(time, this.visible_timing.value[1], Charter.settings.data.overlap_minimum)) {
        flag = false
        break
      }

      time = next_bpm_time
      bpm = this.diff.bpm_of_time(time)?.bpm ?? bpm
      time_per_beat = this.diff.time_per_beat(bpm)
      next_bpm_time =
        this.diff.bpm_list().find((x) => x.time > time)?.time ?? this.visible_timing.value[1] + time
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
      .filter((x) => utils.between(x.t, this.visible_timing.value))
      .map((v) => {
        context.fillText((v.ix + 1).toString(), 36, processT(v.t) + 15, 40)
        // context.fillRect(0, processT(val) - 5, 40, 6)
      })
  }
}

// @ts-ignore
window.chart = _chart
