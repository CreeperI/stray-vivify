import { ChartType } from '@preload/types'
import { Ref, ref, watch } from 'vue'
import { Chart, ms } from './chart'
import { Charter } from '../charter'
import { Lazy, utils } from '../utils'

function parse_type(v: ChartType.note['n']) {
  switch (v) {
    case 'n': return 0
    case 'b': return 1
    case 'h': return 2
    case 'p': return 3
    case 'm': return 6
    case 'mb': return 7
    case 's': return 8
    default:
      throw new Error('Unknown Type.' + v)
  }
}
export class Chart_diff {
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

  static createDiff(): ChartType.Diff {
    return {
      name: 'Finale',
      hard: '14+',
      notes: [{ n: 'p', t: 0, l: 0, v: 120 }],
      charter: 'Terminal Flow'
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
    this.set_notes(v.notes)
    return this
  }

  save(): ChartType.Diff {
    this.sort()
    return {
      name: this.name,
      hard: this.hard,
      notes: this.notes,
      charter: this.charter
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
    return list.findLast((v) => v.time <= time) ?? list[0]
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
      return this.isVisible(x, [t - 3000, t + 3000]) && x.n != 'p'
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

  to_vsc() {
    const strs:string[] = []
    for (const note of this.notes) {
      let str = note.t.toFixed(2)
      str += "," + parse_type(note.n)
      str += "," + note.l + ","
      if (note.n == 'h') {
        str += note.h.toFixed(2)
      } else if (note.n == 'p') {
        str += `b:${note.v}|t:${note.t.toFixed(2)}|v:undefined|s:undefined`
      }
      strs.push(str)
    }
    return strs
  }
}
