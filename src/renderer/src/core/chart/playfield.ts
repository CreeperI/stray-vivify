import { ChartTypeV2, storages } from '@preload/types'
import { Ref, ref, shallowRef } from 'vue'
import { Storage } from '../storage'
import { utils } from '../utils'
import { Chart } from './chart'
import { Chart_diff } from './diff'
import { FrameRate } from '@renderer/core/misc/frame-rates'

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
  private processed_notes: Set<ChartTypeV2.note> = new Set() // Track processed notes

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
    this.offset = Storage.settings.offset2

    this.shown = shallowRef([])
    this.key_pressed = [false, false, false, false]
    this.holding = []
    this.timing = Storage.settings.judgement

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
    const visible = [t - 1000, t + Storage.computes.visible.value + 1500] as [number, number]
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

    // Get all hittable notes in timing window
    const can_handle = this.shown.value.filter((x) => {
      // Skip if note already processed
      if (this.processed_notes.has(x)) return false
      // Skip if hold note is already being held
      if (this.holding.includes(x as ChartTypeV2.hold_note)) return false
      // Check if note covers this key lane
      if (x.lane <= key && x.lane + x.width > key) {
        const delta = Math.abs(x.time - current)
        // Use miss window for all notes (including bombs)
        return delta <= this.timing.p5
      }
      return false
    })

    if (can_handle.length == 0) {
      this.empty_key++
      return
    }

    // Sort by absolute time difference (closest note first)
    can_handle.sort((a, b) => Math.abs(a.time - current) - Math.abs(b.time - current))

    // Process the closest note only
    const note = can_handle[0]

    if ('len' in note) {
      // Hold note
      const delta = current - note.time
      const jr = this.what_judgement_hold(delta)
      if (jr !== null) {
        this.j(current, jr, delta)
        this.holding.push(note)
        this.spawn_particle(jr, note.width, note.lane)
        this.processed_notes.add(note)
      }
    } else {
      // Normal note
      if (this.judge_normal(note, current)) {
        this.processed_notes.add(note)
        this.remove_note(note)
      }
    }
  }

  handle_keyup(key: number) {
    const current = this.chart.audio.current_time - this.offset
    this.key_pressed[key] = false
    this.refs.value.key_pressed[key] = false

    const can_handle_holds = this.holding.filter((x) => {
      // Check if the note covers the key that was released
      if (x.lane <= key && x.lane + x.width > key) {
        return x.time + x.len >= current
      }
      return false
    })

    for (const note of can_handle_holds) {
      // Check if any required key is still being pressed
      let still_holding = false
      for (let i = note.lane; i < note.lane + note.width; i++) {
        if (this.key_pressed[i]) {
          still_holding = true
          break
        }
      }

      if (!still_holding) {
        const delta = current - note.time - note.len
        const judgment = this.what_judgement_hold_end(delta)
        this.j(current, judgment, current - note.time)
        this.holding = this.holding.filter((x) => x !== note)
        // Note: Don't remove from notes array here as it's already removed when hold started
      }
    }
  }

  /**
   * Judge a normal note (non-hold)
   */
  judge_normal(note: ChartTypeV2.normal_note, time: number): boolean {
    const delta = time - note.time

    // Handle bomb notes
    if (note.snm == 1) {
      if (Math.abs(delta) <= this.timing.p2) {
        this.j(time, 5, delta) // BOOM judgment
        this.spawn_particle(5, note.width, note.lane)
        return true
      }
      return false
    }

    // Handle normal notes, S notes, and bumpers
    let judgment: number | null

    if (note.width == 1 || note.snm == 2) {
      // Single notes or S notes - use normal timing
      judgment = this.what_judgement(delta)
    } else {
      // Bumper notes - more lenient timing
      judgment = this.what_judgement_bumper(delta)
    }

    if (judgment !== null) {
      this.j(time, judgment, delta)
      this.spawn_particle(judgment, note.width, note.lane)
      return true
    }

    return false
  }

  what_judgement(delta: number): number | null {
    const abs = Math.abs(delta)
    if (abs <= this.timing.p1) return 0
    else if (abs <= this.timing.p2) return Math.sign(delta)
    else if (abs <= this.timing.p3) return Math.sign(delta) * 2
    else if (abs <= this.timing.p4) return Math.sign(delta) * 3
    else return delta < -this.timing.p5 ? -4 : null
  }

  what_judgement_hold(delta: number): number | null {
    const abs = Math.abs(delta)
    if (abs <= this.timing.p1) return 0
    else if (abs <= this.timing.p2) return Math.sign(delta)
    else if (abs <= this.timing.p3) return Math.sign(delta) * 2
    else if (abs <= this.timing.p4) return Math.sign(delta) * 3
    else if (abs <= this.timing.p5) return Math.sign(delta) * 4 // Allow miss judgment for holds
    else return null
  }

  what_judgement_hold_end(delta: number): number {
    // For hold ends, only early release matters (negative delta)
    if (delta >= 0) return 0 // Perfect if released on time or late

    const abs = Math.abs(delta)
    if (abs <= this.timing.p1) return 0
    else if (abs <= this.timing.p2) return -1
    else if (abs <= this.timing.p3) return -2
    else if (abs <= this.timing.p4) return -3
    else return -4 // Miss for very early release
  }

  what_judgement_bumper(delta: number): number | null {
    const abs = Math.abs(delta)
    // Bumpers are more lenient - use Good timing window but give Pure judgment
    if (abs <= this.timing.p4) return 0
    else if (abs <= this.timing.p5) return Math.sign(delta) * 4 // Miss if outside good window
    else return null
  }

  // Handle notes that have passed their timing window
  out_of_time(current: number) {
    const late_notes = this.shown.value.filter((x) => {
      if (this.processed_notes.has(x)) return false

      if ('len' in x) {
        // Hold note - check if start was missed
        if (!this.holding.includes(x)) {
          return current - x.time > this.timing.p5
        }
        return false
      } else {
        // Normal note
        if (x.snm == 1) {
          // Bomb - if not hit within bomb window, it's safe
          return current - x.time > this.timing.p2
        } else {
          // Regular note - missed if past miss window
          return current - x.time > this.timing.p5
        }
      }
    })

    // Process missed notes
    for (const note of late_notes) {
      if ('len' in note) {
        // Missed hold note - give two miss judgments (start + end)
        this.j(current, 4, current - note.time)
        this.j(current, 4, current - note.time)
        this.spawn_particle(4, note.width, note.lane)
      } else if (note.snm == 1) {
        // Bomb that wasn't hit - give perfect judgment (avoided successfully)
        this.j(note.time, 0, 0)
        this.spawn_particle(0, note.width, note.lane)
      } else {
        // Regular missed note
        this.j(current, 4, current - note.time)
        this.spawn_particle(4, note.width, note.lane)
      }
      this.processed_notes.add(note)
      this.remove_note(note)
    }

    // Check for hold note ends that were missed
    this.holding = this.holding.filter(note => {
      if (current > note.time + note.len) {
        // Hold ended naturally - give perfect judgment for the end
        this.j(current, 0, 0)
        this.processed_notes.add(note)
        // Don't remove from notes array here as it's already removed
        return false
      }
      return true
    })
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

    // Update combo - break on miss or bomb hit
    if (Math.abs(lvl) <= 3) {
      this.refs.value.combo++
    } else {
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

    if (this.judgements.length === 0) {
      this._acc = 100
      this.refs.value.acc = this._acc
      return
    }

    this._acc = this.judgements
      .map(function (x): number {
        const absLvl = Math.abs(x.lvl)
        if (absLvl == 0) return 101  // Pure/MAX
        if (absLvl == 1) return 100  // Perfect
        if (absLvl == 2) return 80   // Great
        if (absLvl == 3) return 50   // Good
        if (absLvl == 4) return 0    // Miss
        if (absLvl == 5) return 0    // Bomb hit
        return 0
      })
      .reduce((a, b) => a + b, 0) / this.judgements.length

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
    const lane_width = Storage.settings.lane_width
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
