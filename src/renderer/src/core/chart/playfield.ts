import { ChartTypeV2, storages } from '@preload/types'
import { Ref, ref, shallowRef } from 'vue'
import { Settings } from '../Settings'
import { utils } from '../utils'
import { Chart } from './chart'
import { Chart_diff } from './diff'
import { FrameRate } from '@renderer/core/frame-rates'

export class Chart_playfield {
  judgements: ChartTypeV2.note_judgement[]
  combo_max: number
  notes: ChartTypeV2.note[]
  shown: Ref<ChartTypeV2.note[]>
  last_update: number
  key_pressed: [boolean, boolean, boolean, boolean]
  timing: storages.settings['judgement']
  _acc_timer: number
  _click_time: number[]
  max_cps: number
  max_combo: number
  refs: Ref<{
    acc: number
    click_sec: number
    key_pressed: [boolean, boolean, boolean, boolean]
    last_judgement: number
    combo: number
  }>
  private readonly offset: number
  private holding: ChartTypeV2.hold_note[]
  private chart: Chart
  private diff: Chart_diff
  private readonly keydown_count: number[]
  private empty_key: number

  constructor(ch: Chart) {
    this.chart = ch
    this.diff = ch.diff
    this.judgements = []
    this.diff.update_diff_counts()
    this.combo_max = this.diff.notes.length + this.diff.counts.value.hold
    this.notes = this.diff.notes.slice()
    this.last_update = 0
    this._acc = 0
    this._acc_timer = 0
    this._click_time = []
    this.keydown_count = [0, 0, 0, 0]
    this.empty_key = 0
    this.offset = Settings.editor.offset2

    this.shown = shallowRef([])
    this.key_pressed = [false, false, false, false]
    this.holding = []
    this.timing = Settings.editor.judgement

    this.max_cps = 0
    this.max_combo = 0
    this.refs = ref({
      acc: 0,
      click_sec: 0,
      key_pressed: [false, false, false, false],
      last_judgement: -5,
      combo: 0
    })
  }

  _acc: number

  get acc() {
    this.calc_acc()
    return this._acc
  }

  get final_stats() {
    const counts = {
      p0: 0,
      p1: 0,
      p2: 0,
      p3: 0,
      p4: 0,
      p5: 0,
      pn1: 0,
      pn2: 0,
      pn3: 0,
      pn4: 0
    }
    let total = this.judgements.length ?? 1
    this.judgements.map((x) => {
      if (x.lvl == 0) counts.p0++
      else if (x.lvl == 1) counts.p1++
      else if (x.lvl == 2) counts.p2++
      else if (x.lvl == 3) counts.p3++
      else if (x.lvl == 4) counts.p4++
      else if (x.lvl == 5) counts.p5++
      else if (x.lvl == -1) counts.pn1++
      else if (x.lvl == -2) counts.pn2++
      else if (x.lvl == -3) counts.pn3++
      else if (x.lvl == -4) counts.pn4++
    })
    this.calc_acc()
    this.max_combo = Math.max(this.max_combo, this.refs.value.combo)
    this.chart.diff.update_diff_counts()
    const density = this.chart.diff.counts.value.avg_density
    return {
      counts: counts,
      total: total,
      acc: this._acc,
      max_combo: this.max_combo,
      max_cps: this.max_cps,
      avg_delay: this.avg_delay,
      density: density,
      total_click: this.keydown_count,
      empty: this.empty_key
    }
  }

  get avg_delay() {
    return utils.average(this.judgements.map((x) => x.delta))
  }

  fuck_shown(t: number) {
    if (Math.abs(t - this.last_update) < 1000) return
    const visible = [t - 1000, t + Settings.computes.visible.value + 1500] as [number, number]
    this.shown.value = this.notes.filter((x) => {
      if (utils.between(x.time, visible)) return true
      if ('len' in x) return x.time < visible[0] && x.time + x.len > visible[0]
      return false
    })
    this.last_update = t
  }

  handle_keydown(key: number) {
    const current = this.chart.audio.current_time - this.offset
    this._click_time.push(Date.now())
    this.key_pressed[key] = true
    this.keydown_count[key]++
    this.refs.value.key_pressed[key] = true
    // 1. choose the notes that are in timing window
    // which is between +-p4
    const can_handle = this.shown.value.filter((x) => {
      // here type-errors why but anyway it needs to be
      if (this.holding.includes(x as ChartTypeV2.hold_note)) return false
      if (x.lane <= key && x.lane + x.width > key)
        if (Math.abs(x.time - current) <= this.timing.p5) return true
      return false
    })
    if (can_handle.length == 0) {
      this.empty_key++
      return
    }

    // 2. sort the notes in order of distance to current time
    can_handle.sort((a, b) => Math.abs(a.time - current) - Math.abs(b.time - current))
    console.log(current, can_handle)
    for (const note of can_handle) {
      if ('len' in note) {
        const jr = this.what_judgement_hold(current - note.time)
        if (jr != null) {
          this.j(current, jr, current - note.time)
          this.holding.push(note)
          this.spawn_particle(jr, note.width, note.lane)
          return
        }
      } else {
        if (this.judge_normal(note, current)) {
          return
        }
      }
    }
  }

  handle_keyup(key: number) {
    const current = this.chart.audio.current_time - this.offset
    this.key_pressed[key] = false
    this.refs.value.key_pressed[key] = false
    const can_handle_holds = this.holding.filter((x) => {
      // checks if the note covers the key
      if (x.lane <= key && x.lane + x.width > key) {
        if (x.time + x.len >= current) return true
      }
      return false
    })
    for (const note of can_handle_holds) {
      // any of its key is still holded
      if (this.key_pressed.slice(note.lane, note.lane + note.width).includes(true)) continue
      else {
        this.j(
          current,
          this.what_judgement_hold_end(current - note.time - note.len),
          current - note.time
        )
        this.remove_note(note)
      }
    }
  }

  /**
   * @param time {number} current time
   * @param note {ChartTypeV2.normal_note} the note to be judged
   * @returns {boolean} whether to end this key-judge
   * */
  judge_normal(note: ChartTypeV2.normal_note, time: number): boolean {
    // late is +, early is -
    const delta = time - note.time
    // if it's a bomb then it will miss if in p2
    if (note.snm == 1) {
      if (Math.abs(delta) <= this.timing.p2) {
        this.j(time, 5, delta)
        this.remove_note(note)
        this.spawn_particle(5, note.width, note.lane)
      }
      return false
    } else {
      // it's not a bomb.

      // it's an s or 1w
      if (note.width == 1 || note.snm == 2) {
        const j = this.what_judgement(delta)
        if (j == null) {
          return false
        } else {
          this.j(time, j, delta)
          this.spawn_particle(j, note.width, note.lane)
          this.remove_note(note)
          return true
        }
      } else {
        // it's a bumper
        const j = this.what_judgement_bumper(delta)
        if (j == null) {
          return false
        } else {
          this.j(time, j, delta)
          this.spawn_particle(j, note.width, note.lane)
          this.remove_note(note)
          return true
        }
      }
    }
  }

  what_judgement(delta: number) {
    const abs = Math.abs(delta)
    if (abs <= this.timing.p1) return 0
    else if (abs <= this.timing.p2) return Math.sign(delta)
    else if (abs <= this.timing.p3) return Math.sign(delta) * 2
    else if (abs <= this.timing.p4) return Math.sign(delta) * 3
    else return delta < -this.timing.p5 ? -4 : null
  }

  what_judgement_hold(delta: number) {
    const abs = Math.abs(delta)
    if (abs <= this.timing.p1) return 0
    else if (abs <= this.timing.p2) return Math.sign(delta)
    else if (abs <= this.timing.p3) return Math.sign(delta) * 2
    else if (abs <= this.timing.p4) return Math.sign(delta) * 3
    else return null
  }

  // for hold end the delta is only to be <0 because it's released early
  what_judgement_hold_end(delta: number) {
    delta = -delta
    if (delta <= this.timing.p1) return 0
    else if (delta <= this.timing.p2) return Math.sign(delta)
    else if (delta <= this.timing.p3) return Math.sign(delta) * 2
    else if (delta <= this.timing.p4) return Math.sign(delta) * 3
    else return -4
  }

  what_judgement_bumper(delta: number) {
    const abs = Math.abs(delta)
    if (abs <= this.timing.p4) return 0
    else return null
  }

  // to fuck the late +200 notes and not-bombing mines
  out_of_time(current: number) {
    const late = this.shown.value.filter((x) => {
      if ('snm' in x)
        if (x.snm == 1) {
          return current - x.time > this.timing.p2
        } else {
          return current - x.time > this.timing.p4
        }
      else {
        // so this is hold.
        if (this.holding.includes(x)) return false
        if (current - x.time > this.timing.p4) return true
      }
      return false
    })
    // here notes are late 200+
    for (const note of late) {
      if ('snm' in note) {
        if (note.snm == 1) {
          this.j(note.time, 0, 0)
          this.spawn_particle(0, note.width, note.lane)
        } else {
          this.j(current, 4, current - note.time)
          this.spawn_particle(4, note.width, note.lane)
        }
      } else {
        // because the holds take up 2 judgements.
        this.j(current, 4, current - note.time)
        this.j(current, 4, current - note.time)
        this.spawn_particle(4, note.width, note.lane)
      }
      this.remove_note(note)
    }

    // and check the hold-ends
    for (const note of this.holding) {
      if (current > note.time + note.len) {
        this.j(current, 0, 0)
        this.holding = this.holding.filter((x) => x != note)
        this.remove_note(note)
      }
    }
  }

  remove_note(v: ChartTypeV2.note) {
    this.notes.splice(this.notes.indexOf(v), 1)
    this.shown.value = this.shown.value.filter(
      (x) => !(x.time == v.time && x.lane == v.lane && x.width == v.width)
    )
  }

  j(time: number, lvl: number, delta: number) {
    this.judgements.push({
      time: time,
      lvl: lvl,
      delta: delta
    })
    if (Math.abs(lvl) <= 3) this.refs.value.combo++
    else {
      this.max_combo = Math.max(this.max_combo, this.refs.value.combo)
      this.refs.value.combo = 0
    }
    this.refs.value.last_judgement = lvl
  }

  update_per_frame() {
    FrameRate.playfield_frame.start()
    const current = this.chart.audio.current_time
    this.out_of_time(current)
    this.fuck_shown(current)
    this.calc_clicks()
    FrameRate.playfield_frame.end()
  }

  calc_acc() {
    if (performance.now() - this._acc_timer < 500) return
    this._acc_timer = performance.now()
    this._acc =
      this.judgements
        .map(function (x): number {
          if (x.lvl == 0) return 101
          if (x.lvl == 1 || x.lvl == -1) return 100
          if (x.lvl == 2 || x.lvl == -2) return 80
          if (x.lvl == 3 || x.lvl == -3) return 50
          else return 0
        })
        .reduce((a, b) => a + b, 0) / this.judgements.length
    if (Number.isNaN(this._acc)) this._acc = 100
    this.refs.value.acc = this._acc
  }

  calc_clicks() {
    const now = Date.now()
    this._click_time = this._click_time.filter((x) => x > now - 500)
    this.refs.value.click_sec = this._click_time.length
    this.max_cps = Math.max(this.max_cps, this.refs.value.click_sec)
  }

  refresh() {
    this.calc_acc()
  }

  parse_judgements(v: number) {
    if (v == 0) return 'Pure'
    if (v == 1) return 'Perfect+'
    if (v == 2) return 'Great+'
    if (v == 3) return 'Good+'
    if (v == 4) return 'Miss+'
    if (v == 5) return 'BOOM!'
    if (v == -1) return 'Perfect-'
    if (v == -2) return 'Great-'
    if (v == -3) return 'Good-'
    if (v == -4) return 'Miss-'
    return '-'
  }

  spawn_particle(lvl: number, width: number, lane: number) {
    const container = document.getElementById('svg-particle') as SVGGElement | null
    if (container == null) return
    const lane_width = Settings.editor.lane_width
    const color = ['#ff0', '#ff0', '#7f3', '#54b9ff', '#f00'][Math.abs(lvl)]
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    particle.id = Math.floor(Math.random() * 1000).toFixed(0)
    particle.x.baseVal.value = lane_width * lane + 56
    particle.y.baseVal.value = window.screen.height - 115
    particle.width.baseVal.value = lane_width * width
    particle.height.baseVal.value = 50
    particle.style.transformOrigin = `${lane_width * (lane + 0.5) + 56}px ${particle.y.baseVal.value}px`
    particle.setAttribute('stroke', color)
    particle.setAttribute('stroke-width', '3')
    particle.setAttribute('fill', 'transparent')
    container.append(particle)
    setTimeout(() => {
      particle.remove()
    }, 160)
  }
}
