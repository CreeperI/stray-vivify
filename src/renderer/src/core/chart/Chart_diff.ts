import { ChartTypeV2 } from '@preload/types'
import { computed, ComputedRef, nextTick, Ref, ref, watch } from 'vue'
import { Chart, ms } from './chart'
import { Charter } from '../charter'
import { utils } from '../utils'
import { Settings } from '@renderer/core/Settings'
import { notify } from '@renderer/core/notify'

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
  undo: (() => void)[]
  redo: (() => void)[]
  shown: Ref<ChartTypeV2.note[]>
  update_shown_flag: Ref<boolean>
  last_update: number
  bar_list: Ref<ms[]>
  beat_list: Ref<ms[]>
  // first for bar_list, 2nd beat_list
  shown_bar_beat: Ref<[[ms, number][], ms[]]>
  shown_timing: Ref<ChartTypeV2.timing[]>
  current_timing: ComputedRef<number>

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
    this.bar_list = ref([])
    this.beat_list = ref([])
    this.shown_bar_beat = ref([[], []])
    this.shown_timing = ref([])
    this.current_timing = computed(() =>
      Math.max(
        0,
        this.timing.findLastIndex((v) => v.time <= this.chart.ref.chart_current_time.value)
      )
    )
    watch(
      () => this.bound.value.timing,
      () => {
        this.update_beat_list()
        this.update_bar_list()
      }
    )
    watch(
      () => Settings.editor.meter,
      () => {
        this.update_beat_list()
        this.update_bar_beat_timing(this.visible)
      }
    )
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
    this.bound.value.timing = v.toSorted((a,b) => a.time - b.time)
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
        diff1: ['Finale', "Encore", "Backstage", "Terminal"][Math.floor(Math.random() * 4)],
        diff2: Math.floor(Math.random() * 20) + "+",
        charter: '???'
      },
      ani: []
    }
  }

  update_bar_list() {
    this.bar_list.value = []
    const v = this.timing
    for (let i = 0; i < v.length; i++) {
      const part = v[i]
      const time_per_bar = (60 / part.bpm) * part.num * 1000
      const part_end = this.timing_end_of(part, v, this.chart.length)
      for (let time = part.time; time < part_end; time += time_per_bar) {
        this.bar_list.value.push(time)
      }
    }
  }

  update_beat_list() {
    this.beat_list.value = []
    const v = this.timing
    for (let i = 0; i < v.length; i++) {
      const end = this.timing_end_of(v[i], v, this.chart.length)
      const den = Settings.editor.meter
      // copyright deepseek .jpg
      const time_per_beat = (240 / (v[i].bpm * den)) * 1000 // to ms
      for (let time = v[i].time; time < end; time += time_per_beat) {
        this.beat_list.value.push(time)
      }
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
    this.counts.value.total = v.notes.length

    this.counts.value.avg_density = this.counts.value.total / (this.chart.length / 1000)
  }

  set_notes(v: ChartTypeV2.note[]) {
    this.notes = v
  }

  set_timing(v: ChartTypeV2.timing[]) {
    this.timing = v
  }

  set_diff(v: ChartTypeV2.diff) {
    this.diff1 = v.meta.diff1
    this.charter = v.meta.charter
    this.diff2 = v.meta.diff2
    this.set_notes(v.notes)
    return this
  }

  save(): ChartTypeV2.diff {
    this.sort()
    return {
      notes: this.notes,
      meta: {
        charter: this.charter,
        diff1: this.diff1,
        diff2: this.diff2,
        diff_name: ''
      },
      timing: this.timing,
      ani: []
    }
  }
  sort() {
    this.notes.sort(utils.sort_notes)
    this.notes.forEach((x) => (x.time = Math.floor(x.time)))
    return this.notes
  }

  to_sorted() {
    return this.notes.toSorted(utils.sort_notes)
  }

  add_note(v: ChartTypeV2.note) {
    const r = this.add_note_no_undo(v)
    if (r)
      this.push_undo(() => {
        this.undo_add(v)
      })
    return r
  }

  remove_note(v: ChartTypeV2.note) {
    const r = this.remove_note_no_undo(v)
    if (r)
      this.push_undo(() => {
        this.undo_remove(v)
      })
    Charter.update()
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

  remove_note_no_undo(v: ChartTypeV2.note) {
    if (!this.notes.includes(v)) return false
    this.notes.splice(this.notes.indexOf(v), 1)
    this.fuck_shown(this.chart.audio.current_time, true)
    return true
  }

  add_note_no_undo(v: ChartTypeV2.note) {
    v.time = Math.floor(v.time)
    /*const overlap = Settings.editor.overlap_minimum
    const wrapped = this.shown.value.find((x) => {
      if (x.n == 'h') {
        if (x.l != v.l) return false
        else return utils.between(v.time, [x.time - overlap, x.time + x.h + overlap])
      }
      return utils.around(x.time, v.time, overlap) && x.l == v.l
    })
    if (wrapped) return false*/
    if (this.notes.find((x) => x.time == v.time && x.lane == v.lane && x.width == x.width)) return
    this.notes.push(v)
    this.shown.value.push(v)
    Charter.update()
    return true
  }

  del_note(v: ChartTypeV2.note) {
    this.remove_note(v)
  }

  nearest(t: ms, round = true): ms {
    const bpm = this.bpm_of_time(t)
    if (!bpm) throw new Error('No bpm found???')
    const passed = t - bpm.time
    const per_beat = this.time_per_beat(bpm)
    if (round) return Math.round(passed / per_beat) * per_beat + bpm.time
    else return Math.floor(Math.floor(passed / per_beat) * per_beat + bpm.time)
  }

  bpm_of_time(time: ms) {
    if (time <= 0) time = 0
    return this.timing.findLast((v) => v.time <= time)
  }

  $bpm_of_time(time: ms) {
    const r = this.bpm_of_time(time)
    if (!r) throw new Error("what where's my timing")
    return r
  }

  bpm_of_list(time: ms, list: ChartTypeV2.timing[]) {
    if (time <= 0) time = 0
    return list.findLast((v) => v.time <= time) ?? list[0]
  }

  time_per_beat(timing: ChartTypeV2.timing): ms {
    const meter = Settings.editor.meter
    return (240 / (timing.bpm * meter)) * 1000 // to ms
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
    this.notes.forEach((x) => (x.time = Math.floor(x.time)))
  }

  fuck_shown(t: number, force = false) {
    if (force ? false : Math.abs(t - this.last_update) < 2000) return
    this.update_shown_flag.value = true
    const visible = [t - 2000, t + Settings.computes.visible.value + 2500] as [number, number]
    this.shown.value = this.notes.filter((x) => {
      return this.isVisible(x, visible)
    })
    this.update_bar_beat_timing(visible)
    this.last_update = t
    nextTick().then(() => (this.update_shown_flag.value = false))
  }

  update_bar_beat_timing(visible: [number, number]) {
    this.shown_bar_beat.value = [
      // why this type-errors i cant understand all-fucking-night
      this.bar_list.value.map((x, dx) => [x, dx]).filter((x) => utils.between(x[0], visible)) as [
        number,
        number
      ][],
      this.beat_list.value.filter((x) => utils.between(x, visible))
    ]
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
        if (note.snm == 2) return { time: note.time, lane: note.lane, n: 's' }
        else if (note.snm == 1) {
          if (note.width == 1) return { time: note.time, lane: note.lane, n: 'm' }
          else return { time: note.time, lane: note.lane, n: 'mb' }
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
      notify.error("已有相同时间点的timing。")
      return same
    }
    this.timing.push(timing)
    this.timing.sort((a, b) => a.time - b.time)
    return -1
  }
}
