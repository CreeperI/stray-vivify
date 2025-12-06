import { Chart } from '@renderer/core/chart/chart'
import { Chart_diff } from '@renderer/core/chart/diff'
import { ChartTypeV2 } from '@preload/types'
import { Storage } from '@renderer/core/storage'
import { utils } from '@renderer/core/utils'
import { ref, Ref } from 'vue'

export const factory_strings = ['Astral Quantization']
export const factory_keys: {
  [K in keyof ChartTypeV2.SV_Factory.list as K extends `${number}` ? K : never]: Record<
    keyof Omit<ChartTypeV2.SV_Factory.list[K], 'type' | 'time' | 'end'>,
    string
  >
} = [
  { eff: 'note上的eff' }
]
export class Chart_Diff_SV {
  chart: Chart
  diff: Chart_diff
  time_bottom: Ref<(cur: number, n: { time: number }) => number>
  on_sv: Ref<boolean>
  shown: Ref<ChartTypeV2.sv_all[]>
  sv_data: Ref<{ is_factory: boolean; type: number; ix: number }>
  private renderStartTime: number = -Infinity
  private renderEndTime: number = Infinity
  private breakpoints: number[] = []
  private cumDists: number[] = []
  private segments: { t: number; mul: number }[] = []
  private last_parsed: ChartTypeV2.parsed_sv[]

  constructor(diff: Chart_diff) {
    this.diff = diff
    this.chart = diff.chart
    this.time_bottom = ref((_1, _2) => 0)
    this.last_parsed = []
    this.on_sv = ref(false)
    this.shown = ref([])
    this.sv_data = ref({ is_factory: false, type: 0, ix: 0 })
  }

  get sv() {
    return this.diff.bound.value.sv
  }

  get parsed() {
    if (this.last_parsed.length > 0) return this.last_parsed
    const p: ChartTypeV2.parsed_sv[] = []
    this.diff.bound.value.sv.forEach((x) => {
      if ('type' in x) {
        p.push(...this[`parse_sv_${x.type}`](x))
      } else p.push({ time: x.time, eff: x.eff, line: true })
    })
    if (p.length == 0) p.push({ time: 0, eff: 1, line: true })
    return p
  }

  get mul() {
    return Storage.computes.mul.value
  }

  static new_sv(type: number) {
    switch (type) {
      case 0:
        return {
          type: 0,
          time: 0,
          end: 0,
          eff: 0.1,
        }
      default:
        return {
          type: -1,
          time: 0,
          end: 0
        }
    }
  }

  set_eff() {
    this.sv_data.value.is_factory = false
  }
  set_fct() {
    this.sv_data.value.is_factory = true
  }

  invalidate() {
    this.last_parsed = []
  }

  fuck_shown() {
    const visible = this.diff.visible
    this.shown.value = this.sv.filter((x) => {
      if (utils.between(x.time, visible)) return true
      if ('type' in x) return x.time < visible[0] && x.end > visible[0]
      return false
    })
  }

  check_overlap(v: ChartTypeV2.sv_all): boolean {
    const vHasType = 'type' in v
    return this.sv.some((x) => {
      const xHasType = 'type' in x
      if (xHasType && vHasType) {
        return x.time < v.end && v.time < x.end
      } else if (xHasType && !vHasType) {
        return v.time >= x.time && v.time < x.end
      } else if (!xHasType && vHasType) {
        return x.time >= v.time && x.time < v.end
      } else {
        return x.time === v.time
      }
    })
  }

  add_sv(v: ChartTypeV2.sv_all) {
    const ix = this.sv.findIndex((x) => x.time == v.time)
    if (ix >= 0) return false
    if (this.check_overlap(v)) return false
    this.sv.push(v)
    this.sv_data.value.ix = this.shown.value.push(v) - 1
    this.invalidate()
    return true
  }

  remove_sv(v: { time: number }) {
    const ix = this.sv.findIndex((x) => x.time == v.time)
    if (ix > -1) {
      this.sv.splice(ix, 1)
      this.invalidate()
      this.shown.value.splice(
        this.shown.value.findIndex((x) => x.time === v.time),
        1
      )
      this.sv_data.value.ix = -1
      return true
    }
    return false
  }

  updateRenderRange(renderStartTime: number, renderEndTime: number): void {
    // Avoid unnecessary rebuild
    if (
      renderStartTime === this.renderStartTime &&
      renderEndTime === this.renderEndTime &&
      this.breakpoints.length > 0
    ) {
      console.log("no change render")
      return
    }

    const svEvents = this.parsed

    this.renderStartTime = renderStartTime
    this.renderEndTime = renderEndTime

    // 1. Sort and filter relevant SV events
    const sorted = [...svEvents]
      .filter((ev) => ev.time <= renderEndTime)
      .sort((a, b) => a.time - b.time)

    // 2. Find initial multiplier at renderStartTime
    let currentMult = 1.0
    for (const ev of svEvents) {
      if (ev.time <= renderStartTime) {
        currentMult = ev.eff
      } else {
        break
      }
    }

    // 3. Build segments within [renderStartTime, renderEndTime]
    this.segments = [{ t: renderStartTime, mul: currentMult }]
    for (const ev of sorted) {
      if (ev.time > renderStartTime && ev.time <= renderEndTime) {
        this.segments.push({ t: ev.time, mul: ev.eff })
      }
    }
    this.segments.push({ t: renderEndTime, mul: this.segments[this.segments.length - 1].mul })

    // 4. Precompute breakpoints and cumulative distances
    this.breakpoints = [renderStartTime]
    this.cumDists = [0]

    for (let i = 0; i < this.segments.length - 1; i++) {
      const segStart = this.segments[i].t
      const segEnd = this.segments[i + 1].t
      const mult = this.segments[i].mul
      const dist = this.mul * mult * (segEnd - segStart)
      this.breakpoints.push(segEnd)
      this.cumDists.push(this.cumDists[this.cumDists.length - 1] + dist)
    }

    this.time_bottom.value = (cur: number, n: { time: number }) => {
      return this.getDistance(cur, n)
    }
  }

  getDistance(current: number, note: { time: number }): number {
    const t1 = current
    const t2 = note.time

    // Binary search for index of last breakpoint <= t
    const findIndex = (t: number): number => {
      let lo = 0
      let hi = this.breakpoints.length - 1
      while (lo < hi) {
        const mid = (lo + hi + 1) >>> 1
        if (this.breakpoints[mid] <= t) lo = mid
        else hi = mid - 1
      }
      return lo
    }

    const i1 = findIndex(t1)
    const i2 = findIndex(t2)

    if (i1 === i2) {
      const mult = this.segments[i1].mul
      return this.mul * mult * (t2 - t1)
    }

    let dist = 0

    // First partial segment
    const mult1 = this.segments[i1].mul
    dist += this.mul * mult1 * (this.breakpoints[i1 + 1] - t1)

    // Full middle segments
    if (i2 - 1 > i1) {
      dist += this.cumDists[i2] - this.cumDists[i1 + 1]
    }

    // Last partial segment
    const mult2 = this.segments[i2].mul
    dist += this.mul * mult2 * (t2 - this.breakpoints[i2])

    return dist
  }

  parse_sv_0(f: ChartTypeV2.SV_Factory.SV_aq): ChartTypeV2.parsed_sv[] {
    let _times = this.diff.notes
      .filter((x) => utils.between(x.time, [f.time, f.end]))
      .map((x) => x.time)
    const times = [...new Set(_times)]
    times.sort((a, b) => a - b)

    const parsed: ChartTypeV2.parsed_sv[] = []
    for (let i = 0; i < times.length; i++) {
      const time = times[i]
      const next = times[i + 1] ?? f.end
      parsed.push({
        time: time,
        eff: f.eff,
        line: false
      })
      parsed.push({
        time: time + 1,
        eff: (next - time - 1) / f.eff,
        line: false
      })
    }
    parsed.pop()
    parsed.push({
      time: f.end,
      eff: 1,
      line: true
    })
    return parsed
  }

  new_sv(type: number) {
    return Chart_Diff_SV.new_sv(type)
  }
}
