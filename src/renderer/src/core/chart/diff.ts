import { ChartTypeV2 } from '@preload/types'
import { computed, ComputedRef, nextTick, Ref, ref, watch } from 'vue'
import { Chart, ms } from './chart'
import { Charter } from '../charter'
import { utils } from '../utils'
import { Settings } from '@renderer/core/settings'
import { notify } from '@renderer/core/notify'
import { FrameRate } from '@renderer/core/frame-rates'

function parse_type(v: string) {
  switch (v) {
    case 'n':
      return 0
    case 'b':
      return 1
    case 'h':
      return 2
    case 'm':
      return 6
    case 'mb':
      return 7
    case 's':
      return 8
    case 'p':
      return 3
    default:
      throw new Error('Unknown Type.' + v)
  }
}
function isNote(v: ChartTypeV2.note): v is ChartTypeV2.normal_note {
  return 'snm' in v
}

export class Chart_diff {
  bound: Ref<ChartTypeV2.diff>
  chart: Chart
  counts: Ref<{
    chip: number
    bpm: number
    hold: number
    bomb: number
    hold_bumper: number
    bumper: number
    total: number
    avg_density: number
    s: number
  }>
  undo: (() => void)[][]
  redo: (() => void)[][]
  shown: Ref<ChartTypeV2.note[]>
  update_shown_flag: Ref<boolean>
  last_update: number
  // 小节线
  bar_list: ms[]
  // 分音 t - 等级
  beat_list: [ms, number][]
  ticks: [ms, number][]
  // first for bar_list, 2nd beat_list
  shown_t: Ref<{ bar_list: [ms, number][]; beat_list: [ms, number][]; ticks: [ms, number][] }>
  shown_timing: Ref<ChartTypeV2.timing[]>
  current_timing: ComputedRef<number>
  density_data: Ref<number[]>

  on_operating: boolean
  operating_fns: (() => void)[]
  hit_error: boolean

  constructor(chart: Chart) {
    this.bound = chart.ref.diff
    this.chart = chart
    this.counts = ref({
      chip: 0,
      bpm: 0,
      hold: 0,
      bomb: 0,
      hold_bumper: 0,
      bumper: 0,
      s: 0,
      total: 0,
      avg_density: 0
    })
    watch(this.bound, () => this.update_diff_counts())
    this.undo = []
    this.redo = []
    this.shown = ref([])
    this.update_shown_flag = ref(false)
    this.last_update = 0
    this.bar_list = []
    this.beat_list = []
    this.shown_t = ref({
      bar_list: [],
      beat_list: [],
      ticks: []
    })
    this.shown_timing = ref([])
    this.current_timing = computed(() =>
      Math.max(
        0,
        this.timing.findLastIndex((v) => v.time <= this.chart.audio.refs.current_ms.value)
      )
    )
    this.density_data = ref([0])
    watch(
      () => this.bound.value.timing,
      () => {
        this.update_beat_list()
        this.update_bar_list()
        this.update_tick_list()
      }
    )
    watch(
      () => Settings.editor.meter,
      () => {
        this.update_beat_list()
        this.update_t(this.visible)
      }
    )
    // which is for 分音
    // 我想做一个和pjsk.moe那种差不多的谱面导出所以加了一个分音的list
    this.ticks = []

    this.on_operating = false
    this.operating_fns = []

    this.hit_error = false
  }

  get notes() {
    return this.bound.value.notes
  }

  set notes(v: ChartTypeV2.note[]) {
    this.bound.value.notes = v
    this.update_diff_counts()
  }

  get diff1() {
    return this.bound.value.meta.diff1
  }

  set diff1(v: string) {
    this.bound.value.meta.diff1 = v
    this.chart.set_header_name()
  }

  get diff2() {
    return this.bound.value.meta.diff2
  }

  set diff2(v: string) {
    this.bound.value.meta.diff2 = v
    this.chart.set_header_name()
  }

  get charter() {
    return this.bound.value.meta.charter
  }

  set charter(v: string) {
    this.bound.value.meta.charter = v
  }

  get timing() {
    return this.bound.value.timing
  }

  set timing(v: ChartTypeV2.timing[]) {
    this.bound.value.timing = v.toSorted((a, b) => a.time - b.time)
  }

  get visible(): [number, number] {
    return [
      this.chart.audio.current_time - 1000,
      this.chart.audio.current_time + Charter.refs.visible.value + 2500
    ]
  }

  static createDiff(): ChartTypeV2.diff {
    return {
      notes: [],
      timing: [{ time: 0, bpm: 120, num: 4, den: 4 }],
      meta: {
        diff_name: '',
        diff1: ['Finale', 'Encore', 'Backstage', 'Terminal'][Math.floor(Math.random() * 4)],
        diff2: Math.floor(Math.random() * 20) + '+',
        charter: '???'
      },
      ani: [],
      sv: []
    }
  }

  update_bar_list() {
    this.bar_list = []
    const v = this.timing
    for (let i = 0; i < v.length; i++) {
      const part = v[i]
      const time_per_bar = (60 / part.bpm) * part.num * 1000
      const part_end = this.timing_end_of(part, v, this.chart.length)
      for (let time = part.time; time < part_end; time += time_per_bar) {
        this.bar_list.push(time)
      }
    }
  }

  update_beat_list() {
    this.beat_list = []
    const v = this.timing

    for (let i = 0; i < v.length; i++) {
      const timing = v[i]
      const end = this.timing_end_of(timing, v, this.chart.length)
      const den = Settings.editor.meter

      // Available snap divisors that are <= den, in order (coarsest to finest)
      const mod = [1, 4, 8, 16, 32].filter((snap) => snap <= den)

      function to_level(beat_index: number) {
        // Find the coarsest snap divisor that this beat falls on
        for (let i = 0; i < mod.length; i++) {
          const snap = mod[i]
          if (beat_index % (den / snap) === 0) {
            return i + 1
          }
        }
        return mod.length + 1 // Fallback
      }

      const time_per_beat = (240 / (timing.bpm * den)) * 1000
      let beat_index = 0

      for (let time = timing.time; time < end; time += time_per_beat) {
        this.beat_list.push([time, to_level(beat_index)])
        beat_index++
      }
    }
  }

  update_tick_list() {
    this.ticks = []
    const v = this.timing
    const all_times = [...new Set(this.notes.map((v) => v.time))]
    for (let i = 0; i < v.length; i++) {
      const part = v[i]
      // ms
      const time_per_4 = 60000 / part.bpm
      const part_end = this.timing_end_of(part, v)
      const part_times =
        i == 0
          ? all_times.filter((v) => v < part_end)
          : all_times.filter((v) => v >= part.time && v < part_end)

      // here got a len-1 'c i want to make the last independently fucked
      for (let j = 0; j < part_times.length - 1; j++) {
        const tick = (time_per_4 / (part_times[j + 1] - part_times[j])) * 4
        // if it's a tick longer than 3' then fuck it away i dont need fuck you fuck you
        if (tick < 3) continue
        this.ticks.push([part_times[j], Math.round(tick)])
      }
      const tick = (time_per_4 / (part_end - part_times[part_times.length - 1])) * 4
      if (tick > 2 && tick < 256)
        this.ticks.push([part_times[part_times.length - 1], Math.round(tick)])
    }
  }

  timing_end_of(t: ChartTypeV2.timing, timing: ChartTypeV2.timing[], max = Infinity) {
    const idx = timing.findIndex((v) => t.time == v.time)
    if (max == Infinity) console.warn('max with Infinity may cause a infinite-loooop!')
    if (idx === -1) throw new Error()
    else if (idx == timing.length - 1) return max
    else return timing[idx + 1].time
  }

  timing_end(t: ChartTypeV2.timing) {
    return this.timing_end_of(t, this.timing, this.chart.length)
  }

  update_diff_counts() {
    const v = this.bound.value
    const count = {
      chip: 0,
      bumper: 0,
      hold: 0,
      hold_bumper: 0,
      bomb: 0,
      s: 0
    }
    for (const note of v.notes) {
      if ('len' in note) {
        if (note.width == 1) count.hold += 1
        else count.hold_bumper += 1
      } else {
        if (note.snm == 1) {
          count.bomb += 1
          continue
        } else if (note.snm == 2) {
          count.s += 1
          count.bumper += 1
          continue
        }
        if (note.width == 1) count.chip += 1
        else count.bumper += 1
      }
    }
    this.counts.value.chip = count.chip
    this.counts.value.bumper = count.bumper
    this.counts.value.hold = count.hold
    this.counts.value.hold_bumper = count.hold_bumper
    this.counts.value.bomb = count.bomb
    this.counts.value.s = count.s
    this.counts.value.bpm = this.timing.length - 1
    this.counts.value.total = v.notes.length + count.hold

    this.counts.value.avg_density = this.counts.value.total / (this.chart.length / 1000)
  }

  set_notes(v: ChartTypeV2.note[]) {
    this.notes = v
  }

  add_note(v: ChartTypeV2.note) {
    const r = this.add_note_no_undo(v)
    if (r)
      this.push_undo(() => {
        this.undo_add(v)
      })
    return r
  }
  add_notes(v: ChartTypeV2.note[]) {
    const r: boolean[] = []
    const undo: (() => void)[] = []
    for (let i = 0; i < v.length; i++) {
      r.push(this.add_note_no_undo(v[i], false))
      undo.push(() => {
        this.remove_note_no_undo(v[i])
      })
    }
    this.push_undo(() => {
      undo.forEach((v) => v())
    })
    this.fuck_shown(this.chart.audio.current_time, true)
    return r.every((v) => v)
  }

  remove_note(v: ChartTypeV2.note) {
    const r = this.remove_note_no_undo(v)
    if (r)
      this.push_undo(() => {
        this.undo_remove(v)
      })
    return r
  }
  remove_notes(v: ChartTypeV2.note[]) {
    const undo: (() => void)[] = []
    for (let i = 0; i < v.length; i++) {
      this.remove_note_no_undo(v[i])
      undo.push(() => {
        this.add_note_no_undo(v[i])
      })
    }
    this.push_undo(() => {
      undo.forEach((v) => v())
    })
  }

  undo_add(v: ChartTypeV2.note) {
    this.remove_note_no_undo(v)
    this.push_redo(() => {
      this.redo_add(v)
    })
  }

  undo_remove(v: ChartTypeV2.note) {
    this.add_note_no_undo(v)
    this.push_redo(() => {
      this.redo_remove(v)
    })
  }

  redo_add(v: ChartTypeV2.note) {
    this.add_note(v)
  }

  redo_remove(v: ChartTypeV2.note) {
    this.remove_note(v)
  }

  /** @returns if the note is successfully removed */
  remove_note_no_undo(v: ChartTypeV2.note) {
    this.shown.value = this.shown.value.filter(
      (n) => !(n.time == v.time && n.lane == v.lane && n.width == v.width)
    )
    const index = this.notes.findIndex(
      (n) => n.time == v.time && n.lane == v.lane && n.width == v.width
    )
    if (index == -1) {
      console.log('unexist', v)
      return false
    }
    this.notes.splice(index, 1)
    return true
  }

  /** @returns if the note is successfully added */
  add_note_no_undo(v: ChartTypeV2.note, fuck = true): boolean {
    v.time = Math.floor(v.time)
    if (this.notes.find((x) => x.time == v.time && x.lane == v.lane && x.width == x.width))
      return false
    if ('len' in v) {
      if (v.len == 0) v = { time: v.time, lane: v.lane, width: 1, ani: [], snm: 0 }
    }
    this.notes.push(v)
    this.fuck_shown(this.chart.audio.current_time, fuck)
    return true
  }

  nearest(t: ms, round = true): ms {
    const bpm = this.bpm_of_time(t)
    if (!bpm) throw new Error('No bpm found???')
    const passed = t - bpm.time
    const per_beat = (240 / (bpm.bpm * Settings.editor.meter)) * 1000
    if (round) return Math.round(Math.round(passed / per_beat) * per_beat + bpm.time)
    else return Math.round(Math.floor(passed / per_beat) * per_beat + bpm.time)
  }

  bpm_of_time(time: ms) {
    if (time <= 0) time = 0
    return this.timing.findLast((v) => v.time <= time) ?? this.timing[0]
  }

  push_undo(fn: () => void) {
    if (this.on_operating) this.operating_fns.push(fn)
    else this.undo.push([fn])
    while (this.undo.length >= 20) this.undo.shift()
  }

  execute_undo() {
    const fns = this.undo.pop()
    if (fns) {
      fns.forEach((fn) => fn())
    }
  }

  push_redo(fn: () => void) {
    if (this.on_operating) this.operating_fns.push(fn)
    else this.redo.push([fn])
    while (this.redo.length >= 20) this.redo.shift()
  }

  execute_redo() {
    const fns = this.redo.pop()
    if (fns) fns.forEach((fn) => fn())
  }

  floor_time() {
    this.notes.forEach((x) => (x.time = Math.floor(x.time)))
  }

  fuck_shown(t: number, force = false) {
    if (force ? false : Math.abs(t - this.last_update) < 2000) return
    this._fuck_shown(t)
  }

  update_t(visible: [number, number]) {
    this.shown_t.value = {
      bar_list: this.bar_list
        .map((x, dx) => [x, dx] as [number, number])
        .filter((x) => utils.between(x[0], visible)),
      beat_list: this.beat_list.filter((x) => utils.between(x[0], visible)),
      ticks: this.ticks.filter((x) => utils.between(x[0], visible))
    }
    this.shown_timing.value = this.timing.filter((x) => utils.between(x.time, visible))
  }

  isVisible(n: ChartTypeV2.note, visible: [number, number]): boolean {
    if (utils.between(n.time, visible)) return true
    if ('len' in n) {
      return n.time < visible[0] && n.time + n.len > visible[0]
    }
    return false
  }

  to_vsc() {
    this.validate_chart()
    const strs: string[] = []
    const parsed_notes = this.notes.map((note) => {
      if ('len' in note) {
        return {
          time: note.time,
          lane: note.lane,
          len: note.len,
          n: 'h'
        }
      } else {
        // then its a note
        if (note.snm == 1) {
          if (note.width == 1) return { time: note.time, lane: note.lane, n: 'm' }
          return { time: note.time, lane: note.lane, n: 'mb' }
        } else if (note.snm == 2) {
          return { time: note.time, lane: note.lane, n: 's' }
        } else {
          if (note.width == 1) return { time: note.time, lane: note.lane, n: 'n' }
          else return { time: note.time, lane: note.lane, n: 'b' }
        }
      }
    })
    const all_the_notes = [
      parsed_notes,
      this.timing.map((x) => {
        return { time: x.time, bpm: x.bpm, n: 'p', lane: 0 }
      })
    ]
      .flat()
      .toSorted((a, b) => a.time - b.time)
    for (const note of all_the_notes) {
      let str = note.time.toFixed(2)
      str += ',' + parse_type(note.n)
      str += ',' + note.lane + ','
      if ('len' in note) {
        // @ts-expect-error why there's fucking me at *note.len* is number|undef
        str += (note.len + note.time).toFixed(2)
      } else if ('bpm' in note) {
        str += `b:${note.bpm}|t:${note.time.toFixed(2)}|v:undefined|s:undefined`
      }
      strs.push(str)
    }
    return strs
  }

  add_timing(timing: ChartTypeV2.timing) {
    let same = this.timing.findIndex((tp) => Math.abs(tp.time - timing.time) < 50)
    if (same != -1) {
      notify.error('已有相同时间点的timing。')
      return same
    }
    this.timing.push(timing)
    this.timing.sort((a, b) => a.time - b.time)
    return -1
  }

  validate_chart() {
    this.notes = this.notes.map((x) => {
      if (x.width == 1 && isNote(x))
        return {
          lane: Math.min(x.lane, 3),
          time: x.time,
          width: 1,
          ani: x.ani,
          snm: x.snm == 2 ? 0 : x.snm
        }
      if (!isNote(x)) {
        if (x.len == 0) {
          return {
            lane: x.lane,
            time: x.time,
            width: x.width,
            ani: x.ani,
            snm: 0
          }
        }
      }
      return x
    })
    if (this.timing.some((x) => x.bpm <= 0)) this.timing = this.timing.filter((x) => x.bpm >= 0)
  }

  calc_density() {
    FrameRate.calc_density.start()
    const max_count = Settings.editor.density_data_count
    const per_length = this.chart.length / max_count
    const d: number[] = []
    for (let i = 0; i < this.chart.length; i += per_length) {
      d.push(
        (this.notes.filter((x) => utils.between(x.time, [i, i + per_length])).length / per_length) *
          1000
      )
    }
    this.density_data.value = d
    FrameRate.calc_density.end()
  }

  update() {
    this.fuck_shown(this.chart.audio.current_time)
    if (!this.chart.audio.paused) {
      if (Settings.editor.hit_sound) this.play_hit()
    }
  }

  sort_timing() {
    this.timing.sort((a, b) => a.time - b.time)
  }

  push_timing(idx: number, delta: number) {
    const end = this.timing_end(this.timing[idx])
    for (let i = 0; i < this.notes.length; i++) {
      if (utils.between(this.notes[i].time, [this.timing[idx].time, end])) {
        this.notes[i].time += delta
      }
    }
    this.timing[idx].time += delta
  }

  push_timing_all(idx: number, delta: number) {
    for (let i = 0; i < this.notes.length; i++) {
      if (this.notes[i].time > this.timing[idx].time) {
        this.notes[i].time += delta
      }
    }
    for (let i = 0; i < this.timing.length; i++) {
      if (this.timing[i].time > this.timing[idx].time) {
        this.timing[i].time += delta
      }
    }
    this.timing[idx].time += delta
    this.update_bar_list()
    this.update_beat_list()
  }

  private _fuck_shown(t: number) {
    FrameRate.fuck_shown.start()
    this.update_shown_flag.value = true
    const visible = [t - 2000, t + Settings.computes.visible.value + 2500] as [number, number]
    this.shown.value = this.notes.filter((x) => {
      return this.isVisible(x, visible)
    })
    /*.toSorted((a,b) => {
      if (isNote(a)) {
        if (!isNote(b)) return 1
        if (a.time == b.time) {
          return b.width - a.width
        } else return a.time - b.time
      } else {
        if (a.time == b.time) return b.width - a.width
        else return a.time - b.time
      }
    })*/
    this.update_t(visible)
    this.last_update = t
    FrameRate.fuck_shown.end()
    nextTick().then(() => (this.update_shown_flag.value = false))
  }

  private play_hit() {
    if (this.hit_error) return

    const FPS = FrameRate.fps.refs.value.avg
    const current = this.chart.audio.current_time - Settings.editor.offset3
    const time = 1000 / FPS // in ms
    if (this.shown.value.find((x) => utils.between(x.time, [current, current + time]))) {
      const sound = new Audio('stray:/__skin__/hit.mp3')
      sound.play()
      sound.onerror = () => {
        this.hit_error = true
        notify.error('无法播放音效。请检查skin下的hit.mp3')
      }
    }
  }

  /*private parse_sv_aq(f: ChartTypeV2.SV_Factory.SV_aq): ChartTypeV2.parsed_sv[] {
    let _times = this.notes.map((x) => x.time).filter((x) => utils.between(x, [f.time, f.end]))
    const times = [...new Set(_times)]
    times.sort((a, b) => a - b)

    const parsed: ChartTypeV2.parsed_sv[] = []
    for (let i = 0; i < times.length; i++) {
      const time = times[i]
      parsed.push({
        time: time - 1,
        eff: f.eff1,
        line: false,
        base: 0
      })
      parsed.push({
        time: time + 1,
        eff: f.eff2,
        line: false,
        base: 0
      })
    }
    parsed.pop()
    parsed.push({
      time: f.end,
      eff: 1,
      line: true,
      base: 0
    })
    return parsed
  }*/
}
