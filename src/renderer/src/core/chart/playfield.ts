import { ChartTypeV2, storages } from '@preload/types'
import { Ref, ref } from 'vue'
import { Storage } from '../storage'
import { utils } from '../utils'
import { Chart } from './chart'
import { Chart_diff } from './diff'
import { FrameRate } from '@renderer/core/misc/frame-rates'

type lvl_string = ChartTypeV2.note_judgement['lvl']

const judgement_color = {
  perfect: '#ff0',
  pure: '#ff0',
  great: '#7f3',
  good: '#54b9ff',
  miss: '#f00'
}
function sign_of(x: number) {
  if (x > 0) return '+'
  return '-'
}

export class Chart_playfield {
  judgements: ChartTypeV2.note_judgement[]
  combo_max: number
  notes: ChartTypeV2.note[]
  shown: Ref<number[]>
  last_update: number
  key_pressed: boolean[]
  timing: storages.settings['judgement']
  _acc_timer: number
  _click_time: number[]
  max_cps: number
  max_combo: number
  refs: {
    acc: Ref<number>
    click_sec: Ref<number>
    key_pressed: Ref<boolean[]>
    last_judgement: Ref<string>
    combo: Ref<number>
  }
  start_from_now: boolean
  private readonly offset: number
  private holding: number[]
  private chart: Chart
  private diff: Chart_diff
  private readonly keydown_count: number[]
  private empty_key: number
  // number-indexs
  private processed_notes: Set<number>
  private processed_lns: Set<number>

  constructor(ch: Chart, start_from_now: boolean) {
    this.chart = ch
    this.start_from_now = start_from_now
    this.diff = ch.diff
    this.judgements = []
    this.diff.update_diff_counts()
    this.combo_max = this.diff.notes.length + this.diff.counts.value.hold
    this.notes = this.diff.notes.slice()
    this.processed_notes = new Set()
    this.processed_lns = new Set()
    this.last_update = 0
    this._acc = 0
    this._acc_timer = 0
    this._click_time = []
    this.keydown_count = [0, 0, 0, 0]
    this.empty_key = 0
    this.offset = Storage.settings.offset2

    this.shown = ref([])
    this.key_pressed = [false, false, false, false]
    this.holding = []
    this.timing = Storage.settings.judgement

    this.max_cps = 0
    this.max_combo = 0
    this.refs = {
      acc: ref(0),
      click_sec: ref(0),
      key_pressed: ref([false, false, false, false]),
      last_judgement: ref(''),
      combo: ref(0)
    }
  }

  _acc: number

  get acc() {
    this.calc_acc()
    return this._acc
  }

  get final_stats() {
    const counts: Record<ChartTypeV2.note_judgement['lvl'], number> = {
      pure: 0,
      'perfect+': 0,
      'great+': 0,
      'good+': 0,
      'miss+': 0,
      'boom!': 0,
      'perfect-': 0,
      'great-': 0,
      'good-': 0,
      'miss-': 0
    }
    let total = this.judgements.length ?? 1
    this.judgements.map((x) => {
      counts[x.lvl]++
    })
    this.calc_acc()
    this.max_combo = Math.max(this.max_combo, this.refs.combo.value)
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
    if (Math.abs(t - this.last_update) < Storage.settings.pooling.interval) return
    const visible = [
      t - Storage.settings.pooling.ahead,
      t + Storage.computes.visible.value + Storage.settings.pooling.ahead
    ] as [number, number]
    this.shown.value = utils.indexes_of(this.notes, (n, ix) => {
      if (utils.between(n.time, visible)) {
        return !this.processed_notes.has(ix)
      }
      if ('len' in n) {
        if (this.processed_lns.has(ix)) return false
        return n.time < visible[0] && n.time + n.len > visible[0]
      }
      return false
    })
    this.last_update = t
  }

  handle_keydown(key: number) {
    if (this.key_pressed[key]) return
    this.key_pressed[key] = true
    this.refs.key_pressed.value[key] = true
    if (this.chart.audio.paused) return

    const current = this.chart.audio.current_time - this.offset
    this._click_time.push(Date.now())
    this.keydown_count[key]++

    // Get all hittable notes in timing window
    const can_handle = this.shown.value.filter((x) => {
      const note = this.notes[x]
      // Skip if note already processed
      if (this.processed_notes.has(x)) return false
      // Skip if hold note is already being held
      if (this.holding.includes(x)) return false
      // Check if note covers this key lane
      if (note.lane <= key && note.lane + note.width > key) {
        const delta = Math.abs(note.time - current)
        // Use miss window for all notes (including bombs)
        return delta <= this.timing.p5
      }
      return false
    })

    if (can_handle.length == 0) {
      console.log('empty at', current)
      this.empty_key++
      return
    }

    // Sort by absolute time difference (closest note first)
    can_handle.sort(
      (a, b) => Math.abs(this.notes[a].time - current) - Math.abs(this.notes[b].time - current)
    )

    // Process the closest note only
    const note = can_handle[0]

    if ('len' in this.notes[note]) {
      // Hold note
      const delta = current - this.notes[note].time
      const jr = this.what_judgement_hold(delta)
      if (jr !== null) {
        this.judge(current, jr, delta)
        this.holding.push(note)
        this.spawn_particle(jr, this.notes[note].width, this.notes[note].lane)
        this.processed_notes.add(note)
      }
    } else {
      // Normal note
      if (this.judge_normal(this.notes[note], current)) {
        this.processed_notes.add(note)
        this.rm_from_shown(note)
      }
    }
  }

  handle_keyup(key: number) {
    if (!this.key_pressed[key]) return
    const current = this.chart.audio.current_time - this.offset
    this.key_pressed[key] = false
    this.refs.key_pressed.value[key] = false

    const can_handle_holds = this.holding.filter((ix) => {
      const x = this.notes[ix] as ChartTypeV2.hold_note
      // Check if the note covers the key that was released
      if (x.lane <= key && x.lane + x.width > key) {
        return x.time + x.len >= current
      }
      return false
    })

    for (const ix of can_handle_holds) {
      const note = this.notes[ix] as ChartTypeV2.hold_note
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
        this.judge(current, judgment, current - note.time)
        this.holding = this.holding.filter((x) => x !== ix)
        this.processed_lns.add(ix)
        this.rm_from_shown(ix)
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
        this.judge(time, 'boom!', delta) // BOOM judgment
        this.spawn_particle('boom!', note.width, note.lane)
        return true
      }
      return false
    }

    // Handle normal notes, S notes, and bumpers
    let judgment: lvl_string | null

    if (note.width == 1 || note.snm == 2) {
      // Single notes or S notes - use normal timing
      judgment = this.what_judgement(delta)
    } else {
      // Bumper notes - more lenient timing
      judgment = this.what_judgement_bumper(delta)
    }

    if (judgment !== null) {
      this.judge(time, judgment, delta)
      this.spawn_particle(judgment, note.width, note.lane)
      return true
    }

    return false
  }

  what_judgement(delta: number): lvl_string | null {
    const abs = Math.abs(delta)
    if (abs <= this.timing.p1) return 'pure'
    else if (abs <= this.timing.p2) return `perfect${sign_of(delta)}`
    else if (abs <= this.timing.p3) return `great${sign_of(delta)}`
    else if (abs <= this.timing.p4) return `good${sign_of(delta)}`
    else return delta < -this.timing.p5 ? 'miss+' : null
  }

  what_judgement_hold(delta: number): lvl_string | null {
    const abs = Math.abs(delta)
    if (abs <= this.timing.p1) return 'pure'
    else if (abs <= this.timing.p2) return `perfect${sign_of(delta)}`
    else if (abs <= this.timing.p3) return `great${sign_of(delta)}`
    else if (abs <= this.timing.p4) return `good${sign_of(delta)}`
    else return null
  }

  what_judgement_hold_end(delta: number): lvl_string {
    // For hold ends, only early release matters (negative delta)
    if (delta >= 0) return 'pure' // Perfect if released on time or late

    const abs = Math.abs(delta)
    if (abs <= this.timing.p1) return 'pure'
    else if (abs <= this.timing.p2) return 'perfect-'
    else if (abs <= this.timing.p3) return 'great-'
    else if (abs <= this.timing.p4) return 'good-'
    else return 'miss-' // Miss for very early release
  }

  what_judgement_bumper(delta: number): lvl_string | null {
    const abs = Math.abs(delta)
    if (abs <= this.timing.p4) return 'pure'
    else return null
  }

  // Handle notes that have passed their timing window
  out_of_time(current: number) {
    const late_notes = this.shown.value.filter((a) => {
      if (this.processed_notes.has(a)) return false
      const x = this.notes[a]
      if ('len' in x) {
        // Hold note - check if start was missed
        if (!this.holding.includes(a)) {
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
    for (const ix of late_notes) {
      const note = this.notes[ix]
      if ('len' in note) {
        // Missed hold note - give two miss judgments (start + end)
        this.judge(current, 'miss+', current - note.time)
        this.judge(current, 'miss+', current - note.time)
        this.spawn_particle('miss+', note.width, note.lane)
      } else if (note.snm == 1) {
        // Bomb that wasn't hit - give perfect judgment (avoided successfully)
        this.judge(note.time, 'pure', 0)
        this.spawn_particle('pure', note.width, note.lane)
      } else {
        // Regular missed note
        this.judge(current, 'miss+', current - note.time)
        this.spawn_particle('miss+', note.width, note.lane)
      }
      this.processed_notes.add(ix)
      this.rm_from_shown(ix)
    }

    // Check for hold note ends that were missed
    this.holding = this.holding.filter((ix) => {
      const note = this.notes[ix] as ChartTypeV2.hold_note
      if (current > note.time + note.len) {
        // Hold ended naturally - give perfect judgment for the end
        this.judge(current, 'pure', 0)
        this.processed_notes.add(ix)
        this.rm_from_shown(ix)
        return false
      }
      return true
    })
  }
  rm_from_shown(ix: number) {
    const i = this.shown.value.indexOf(ix)
    if (i == -1) {
      console.log(`playfield.rm_from_shown: note ix:${ix} not in shown`)
    }
    this.shown.value.splice(i, 1)
  }

  judge(time: number, lvl: lvl_string, delta: number) {
    this.judgements.push({
      time: time,
      lvl: lvl,
      delta: delta
    })

    // Update combo - break on miss or bomb hit
    if (lvl.includes('good') || lvl.includes('miss')) {
      this.max_combo = Math.max(this.max_combo, this.refs.combo.value)
      this.refs.combo.value = 0
    } else {
      this.refs.combo.value++
    }
    this.refs.last_judgement.value = lvl
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
      this.refs.acc.value = this._acc
      return
    }

    this._acc =
      this.judgements
        .map(function (x): number {
          if (x.lvl.includes('pure')) return 101
          if (x.lvl.includes('perfect')) return 100
          if (x.lvl.includes('great')) return 80
          if (x.lvl.includes('good')) return 50
          return 0
        })
        .reduce((a, b) => a + b, 0) / this.judgements.length

    this.refs.acc.value = this._acc
  }

  calc_clicks() {
    const now = Date.now()
    this._click_time = this._click_time.filter((x) => x > now - 500)
    this.refs.click_sec.value = this._click_time.length
    this.max_cps = Math.max(this.max_cps, this.refs.click_sec.value)
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

  spawn_particle(lvl: lvl_string, width: number, lane: number) {
    const container = document.getElementById('svg-particle') as SVGGElement | null
    if (container == null) return
    const lane_width = Storage.settings.lane_width
    const color = judgement_color[lvl.replace(/[+\-]/, '')]
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
