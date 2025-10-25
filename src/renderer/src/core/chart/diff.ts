import { ChartTypeV2 } from '@preload/types'
import { computed, ComputedRef, nextTick, Ref, ref, watch } from 'vue'
import { Chart, ms } from './chart'
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

class HitSoundSystem {
  private hit_error = false
  private audioContext: AudioContext | null = null
  private audioBuffer: AudioBuffer | null = null
  private playedNotes = new Set<number>()
  private gainNode: GainNode | null = null
  private maxVoices = 64
  private activeVoices: Array<{ source: AudioBufferSourceNode; endTime: number }> = []
  private chart: Chart
  private shown: Ref<ChartTypeV2.note[]>

  constructor(chart: Chart, shown: Ref<ChartTypeV2.note[]>) {
    this.chart = chart
    this.shown = shown
    this.initWebAudio()
  }

  public async play_hit() {
    if (this.hit_error || !this.audioBuffer || !this.audioContext || !this.gainNode) {
      return
    }

    const now = this.audioContext.currentTime
    this.activeVoices = this.activeVoices.filter((v) => v.endTime > now)

    const FPS = FrameRate.fps.refs.value.avg
    const current = this.chart.audio.current_time - Settings.editor.offset3
    const delta_time = utils.clamp(1000 / FPS, 16, 30) // in ms

    // Find note in current time window
    const hitNote = this.shown.value.find(
      (x: any) => utils.between(x.time, [current, current + delta_time]) && x['snm'] != 1
    )

    if (hitNote && !this.playedNotes.has(hitNote.time)) {
      if (this.activeVoices.length >= this.maxVoices) {
        this.activeVoices.shift()
      }

      try {
        const source = this.audioContext.createBufferSource()
        source.buffer = this.audioBuffer
        source.connect(this.gainNode)
        source.start(now)

        // Track active voice
        this.activeVoices.push({
          source,
          endTime: now + (this.audioBuffer.duration || 0.5)
        })

        // Mark note as played
        this.playedNotes.add(hitNote.time)

        // Clean up played note marker after it's definitely passed
        setTimeout(() => this.playedNotes.delete(hitNote.time), 200)
      } catch (e) {
        console.error('Failed to play sound:', e)
      }
    }
  }

  private async initWebAudio() {
    try {
      this.audioContext = new AudioContext()
      this.gainNode = this.audioContext.createGain()
      watch(() => Settings.editor.hit_volume, (v) => {
        if (this.gainNode) this.gainNode.gain.value = v / 100
        else notify.error("GainNode炸了")
      })
      this.gainNode.gain.value = 1.0
      this.gainNode.connect(this.audioContext.destination)

      const response = await fetch('stray:/__hit__/')
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    } catch (error) {
      this.hit_error = true
    }
  }
}

function isHoldNote(note: ChartTypeV2.note): note is ChartTypeV2.hold_note {
  return 'len' in note
}

function isNormalNote(note: ChartTypeV2.note): note is ChartTypeV2.normal_note {
  return !isHoldNote(note)
}

type chart_rating_eval = {
  sr: number
  chord: number
  stream: number
  burst: number
  tech: number
}
function calculateStarRating(rawNotes: ChartTypeV2.note[]): chart_rating_eval {
  if (rawNotes.length < 2) {
    return { sr: 0.1, chord: 0, stream: 0, burst: 0, tech: 0 }
  }

  FrameRate.calc_sr.start()

  // 第一步：过滤 mine 并排序（只保留有效 note）
  const notes: ChartTypeV2.note[] = []
  for (const n of rawNotes) {
    if (isNormalNote(n) && n.snm === 1) continue // 跳过 mine
    notes.push(n)
  }
  if (notes.length < 2) {
    return { sr: 0.1, chord: 0, stream: 0, burst: 0, tech: 0 }
  }
  notes.sort((a, b) => a.time - b.time)

  // 第二步：预计算每个 note 的“事件类型”
  type NoteEvent = {
    time: number
    lane: number
    isWide: boolean
    isPrecisionWide: boolean
  }
  const events: NoteEvent[] = []
  for (const n of notes) {
    const isWide = n.width > 1
    const isPrecisionWide = isNormalNote(n) && n.snm === 2 && isWide
    for (let i = 0; i < n.width && n.lane + i < 4; i++) {
      events.push({
        time: n.time,
        lane: n.lane + i,
        isWide,
        isPrecisionWide
      })
    }
  }
  if (events.length === 0) {
    return { sr: 0.1, chord: 0, stream: 0, burst: 0, tech: 0 }
  }
  events.sort((a, b) => a.time - b.time)

  // 第三步：滑动窗口 + 双指针（O(n)）
  const WINDOW_SIZE = 600 // ms
  const STEP = 100 // ms
  const strains: { total: number; chord: number; stream: number; burst: number; tech: number }[] =
    []

  let left = 0
  let t = notes[0].time
  const endTime = notes[notes.length - 1].time

  while (t <= endTime) {
    const windowStart = t - WINDOW_SIZE
    const windowEnd = t

    // 移除过期事件
    while (left < events.length && events[left].time <= windowStart) {
      left++
    }

    // 扫描窗口内事件
    let noteCount = 0
    let wideCount = 0
    let precisionCount = 0
    let minInterval = Infinity
    const laneLast: number[] = Array(4).fill(-Infinity)
    const chordMap = new Map<number, number>()

    let i = left
    while (i < events.length && events[i].time <= windowEnd) {
      const e = events[i]
      noteCount++
      if (e.isWide) wideCount++
      if (e.isPrecisionWide) precisionCount++

      const dt = e.time - laneLast[e.lane]
      if (dt > 0 && dt < 500) {
        minInterval = Math.min(minInterval, dt)
      }
      laneLast[e.lane] = e.time

      chordMap.set(e.time, (chordMap.get(e.time) || 0) + 1)
      i++
    }

    if (noteCount === 0) {
      t += STEP
      continue
    }

    // === 子维度计算 ===
    const density = noteCount / (WINDOW_SIZE / 1000)
    const interval = minInterval === Infinity ? 300 : minInterval

    // burst: 极短间隔（<100ms）
    const burstStrain = interval < 100 ? Math.pow(100 / interval, 0.8) : 0
    // stream: 中等高速流（100~250ms）
    const streamStrain = interval >= 100 && interval <= 250 ? Math.sqrt(density) * 1.2 : 0
    // tech: 协调 + 准度
    const techStrain = (wideCount / noteCount) * 1.5 + (precisionCount / noteCount) * 2.5
    // chord: 同时按
    const maxChord = chordMap.size > 0 ? Math.max(...chordMap.values()) : 1
    const chordStrain = maxChord > 1 ? Math.log2(maxChord) : 0

    // 总 strain（用于 sr）
    const speedStrain = Math.pow(150 / Math.max(interval, 25), 0.6)
    const densityStrain = Math.sqrt(density) * 0.7
    const coordStrain = (wideCount / noteCount) * 2.0
    const precisionStrain = (precisionCount / noteCount) * 3.0
    const totalStrain =
      speedStrain + densityStrain + coordStrain * 0.8 + precisionStrain * 1.2 + chordStrain * 0.7

    strains.push({
      total: totalStrain,
      chord: chordStrain,
      stream: streamStrain,
      burst: burstStrain,
      tech: techStrain
    })

    t += STEP
  }

  if (strains.length === 0) {
    return { sr: 0.1, chord: 0, stream: 0, burst: 0, tech: 0 }
  }

  // 取 top 12% 峰值平均
  const k = Math.max(1, Math.floor(strains.length * 0.12))
  const topK = strains
    .map((x, i) => ({ x, i }))
    .sort((a, b) => b.x.total - a.x.total)
    .slice(0, k)

  const avgTotal = topK.reduce((sum, { x }) => sum + x.total, 0) / k
  const avgChord = topK.reduce((sum, { x }) => sum + x.chord, 0) / k
  const avgStream = topK.reduce((sum, { x }) => sum + x.stream, 0) / k
  const avgBurst = topK.reduce((sum, { x }) => sum + x.burst, 0) / k
  const avgTech = topK.reduce((sum, { x }) => sum + x.tech, 0) / k

  const sr = Math.max(0.1, Math.min(10, parseFloat((Math.sqrt(avgTotal) * 1.6).toFixed(2))))

  const chord = parseFloat((Math.sqrt(avgChord) * 5.5).toFixed(2))
  const stream = parseFloat((Math.sqrt(avgStream) * 4.4).toFixed(2))
  const burst = parseFloat((Math.sqrt(avgBurst) * 4.6).toFixed(2))
  const tech = parseFloat((Math.sqrt(avgTech) * 5.0).toFixed(2))

  return { sr, chord, stream, burst, tech }
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
    total1: number
    avg_density: number
    s: number
    min_bpm: number
    max_bpm: number
    main_bpm: number
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
  section_list: ms[]
  shown_t: Ref<{
    // 小节
    bar_list: [ms, number][]
    // 分音线
    beat_list: [ms, number][]
    // reagain要的拍号
    section_list: [ms, number][]
    // 右边的xx分音
    ticks: [ms, number][]
  }>
  shown_timing: Ref<ChartTypeV2.timing[]>
  current_timing: ComputedRef<number>
  density_data: Ref<number[]>

  on_operating: boolean
  operating_fns: (() => void)[]
  hit_error: boolean

  hit_sounder: HitSoundSystem

  sr: Ref<chart_rating_eval>
  max_lane: Ref<number>

  constructor(chart: Chart, ix = 0) {
    this.bound = ref(chart.diffs[ix])
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
      total1: 0,
      avg_density: 0,
      min_bpm: 0,
      max_bpm: 0,
      main_bpm: 0
    })
    watch(
      this.bound,
      () => {
        this.chart.sync_from_diff()
      },
      { deep: true }
    )
    this.undo = []
    this.redo = []
    this.shown = ref([])
    this.update_shown_flag = ref(false)
    this.last_update = 0
    this.bar_list = []
    this.beat_list = []
    this.section_list = []
    this.shown_t = ref({
      bar_list: [],
      beat_list: [],
      ticks: [],
      section_list: []
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
        this.update_timing_list()
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
    this.hit_sounder = new HitSoundSystem(chart, this.shown)

    this.sr = ref({ sr: 0, chord: 0, stream: 0, burst: 0, tech: 0 })
    this.max_lane = ref(4)
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
    utils.refresh()
  }

  get diff2() {
    return this.bound.value.meta.diff2
  }

  set diff2(v: string) {
    this.bound.value.meta.diff2 = v
    this.chart.set_header_name()
    utils.refresh()
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
      this.chart.audio.current_time + Settings.computes.visible.value + 2500
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
        charter: Settings.data.value.username ?? '???'
      },
      ani: [],
      sv: []
    }
  }

  static validate_notes(notes: ChartTypeV2.note[]) {
    return notes.map((x) => {
      if (x.width == 1 && isNote(x))
        return {
          lane: Math.max(x.lane, 0),
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
  }

  static validate_timing(timing: ChartTypeV2.timing[]) {
    return timing
      .map((x) => {
        if (x.bpm <= 0) return { ...x, bpm: 120 }
        return x
      })
      .sort((a, b) => a.time - b.time)
  }

  calc_max_lane() {
    this.max_lane.value = Math.max(
      Settings.editor.min_lane,
      Math.max(...this.notes.map((n) => n.lane + n.width - 1)) + 1
    )
  }

  update_bar_section_list() {
    this.bar_list = []
    this.section_list = []
    const v = this.timing
    for (let i = 0; i < v.length; i++) {
      const part = v[i]
      const time_per_bar = (60 / part.bpm) * part.num * 1000
      const time_per_section = (60 / part.bpm) * part.den * 250
      const part_end = this.timing_end_of(part, v, this.chart.length)
      for (let time = part.time; time < part_end; time += time_per_bar) {
        this.bar_list.push(time)
      }
      for (let time = part.time; time < part_end; time += time_per_section) {
        this.section_list.push(time)
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

  update_timing_list() {
    this.update_bar_section_list()
    this.update_beat_list()
    this.update_tick_list()
  }

  timing_end_of(t: ChartTypeV2.timing, timing: ChartTypeV2.timing[], max = Infinity) {
    const idx = timing.findIndex((v) => t.time == v.time)
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
    this.counts.value.total1 = v.notes.length

    this.counts.value.avg_density = this.counts.value.total / (this.chart.length / 1000)

    const bpms = this.timing.map((v) => v.bpm)
    this.counts.value.min_bpm = Math.min(...bpms)
    this.counts.value.max_bpm = Math.max(...bpms)

    const bpm_length = this.timing.map(
      (v) => [this.timing_end_of(v, this.timing, this.chart.length), v] as const
    )
    const max_length = Math.max(...bpm_length.map((v) => v[0]))
    const max_timing = bpm_length.find((v) => v[0] == max_length)
    this.counts.value.main_bpm = max_timing?.[1].bpm ?? 0
  }

  set_diff(v: ChartTypeV2.diff) {
    utils.less_assign(this, v as Partial<Chart_diff>)
    this.calc_max_lane()
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
      ticks: this.ticks.filter((x) => utils.between(x[0], visible)),
      section_list: this.section_list
        .map((x, dx) => [x, dx] as [number, number])
        .filter((x) => utils.between(x[0], visible))
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
      str += ',' + note.lane
      if ('len' in note) {
        str += ','
        // @ts-expect-error why there's fucking me at *note.len* is number|undef
        str += (note.len + note.time).toFixed(2)
      } else if ('bpm' in note) {
        str += ','
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
    this.notes = Chart_diff.validate_notes(this.notes)
    if (this.timing.some((x) => x.bpm <= 0)) this.timing = Chart_diff.validate_timing(this.timing)
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
    this.update_bar_section_list()
    this.update_beat_list()
  }

  update_sr() {
    if (!Settings.editor.star_rating) return
    this.sr.value = calculateStarRating(this.notes)
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
    this.hit_sounder.play_hit()
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
