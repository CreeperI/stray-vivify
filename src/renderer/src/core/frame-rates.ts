import { ref, Ref } from 'vue'
import { Settings } from '@renderer/core/Settings'
import { utils } from '@renderer/core/utils'

const all :_FrameRateClass[] = []
export type _frameRateRef = Ref<{
  avg: number
  sd: number
  cv: number
  max: number
  min: number
  call_count: number
}>

const recent_max_length = Settings.editor.time_max_length
export class _FrameRateClass {
  recent: number[]
  // 平均值
  private _avg: number
  // 标准差
  private _sd: number
  // 变异系数
  private _cv: number
  private _max: number
  private _min: number
  private _call_count: number
  private _call_count_2: number
  private last_call: number
  private _call_counts: number[]
  refs: _frameRateRef

  constructor() {
    this._cv = 0
    this._sd = 0
    this._avg = 0
    this._max = 0
    this._min = 0
    this._call_count = 0
    this._call_count_2 = 0
    this._call_counts = []
    this.last_call = 0
    this.refs = ref({
      avg: 0,
      sd: 0,
      cv: 0,
      max: 0,
      min: 0,
      call_count: 0,
    })
    this.recent = [0]
    all.push(this)
  }

  calc() {
    this._avg = this.recent.reduce((a, b) => a + b, 0) / this.recent.length
    this._sd = Math.sqrt(
      this.recent.map((x) => Math.pow(x - this._avg, 2)).reduce((a, b) => a + b, 0) /
        this.recent.length
    )
    this._cv = this._sd / this._avg
    this._max = Math.max(...this.recent)
    this._min = Math.min(...this.recent)
    this.refs.value = {
      avg: this._avg,
      sd: this._sd,
      cv: this._cv,
      max: this._max,
      min: this._min,
      call_count: this._call_count
    }
  }

  refresh() {
    this.recent = this.recent.slice(-recent_max_length)
    this._call_counts.push(this._call_count_2)
    this._call_counts = this._call_counts.slice(-10)
    this._call_count = utils.average(this._call_counts)
    this._call_count_2 = 0
    this.calc()
  }

  start() {
    this.last_call = performance.now()
  }
  end() {
    this.recent.push(performance.now() - this.last_call)
    this._call_count_2++
  }

  get call_count() {
    return this._call_count
  }
}

const aniFrame = new _FrameRateClass()
class _FPS extends _FrameRateClass {
  constructor() {
    super()
    this.recent = []
  }
  refresh() {
    this.recent.push(aniFrame.call_count)
    this.calc()
  }
}
const invalidator = new _FrameRateClass()
export const FrameRate = {
  refresh() {
    invalidator.start()
    all.forEach((v) => v.refresh())
    invalidator.end()
  },
  aniFrame: aniFrame,
  invalidator: invalidator,
  next_tick: new _FrameRateClass(),
  fuck_shown: new _FrameRateClass(),
  fps: new _FPS(),
  playfield_frame: new _FrameRateClass()
}
