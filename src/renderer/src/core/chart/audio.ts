import { computed, ref, Ref, WritableComputedRef } from 'vue'
import { Chart } from '@renderer/core/chart/chart'

type ms = number
type second = number

export class Chart_audio {
  chart: Chart
  file_path: string | undefined
  url: string | undefined
  ele: undefined | HTMLAudioElement
  refs: {
    current_ms: Ref<ms>
    play_rate: Ref<number>
    writable_current_ms: WritableComputedRef<ms>
    writable_play_rate: WritableComputedRef<number>
    writable_current_second: WritableComputedRef<second>
    paused: Ref<boolean>
  }
  last: ms
  from_negative: boolean
  ended: boolean

  constructor(ch: Chart, file_path?: string, url?: string) {
    this.chart = ch
    this.file_path = file_path
    this.url = url
    this.ele = undefined
    if (url) {
      this.ele = new Audio(url)
    }
    this._play_rate = 1
    this._current_time = 0
    this.last = 0
    this._paused = true
    this.from_negative = false
    this.ended = false

    const me = this
    this.refs = {
      current_ms: ref(0),
      play_rate: ref(1),
      writable_current_ms: computed({
        get() {
          return me.refs.current_ms.value
        },
        set(v) {
          me.set_current_time(v)
        }
      }),
      writable_current_second: computed({
        get() {
          return me.refs.current_ms.value / 1000
        },
        set(v) {
          me.set_current_time(v * 1000)
        }
      }),
      writable_play_rate: computed({
        get() {
          return me.refs.play_rate.value
        },
        set(v) {
          me.play_rate = v
        }
      }),
      paused: ref(true)
    }
  }

  _paused: boolean

  get paused() {
    return this._paused
  }

  set paused(v: boolean) {
    this._paused = v
    this.refs.paused.value = v
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

  get $ele() {
    return this.ele as HTMLAudioElement
  }

  set_current_time(v: ms) {
    v = Math.floor(Math.max(-5000, v))
    this.pause()
    this._current_time = v
    this.refs.current_ms.value = v
    if (v < 0) this.from_negative = true
    if (this.paused) this.set_ele_time(v)
    this.chart.diff.reset_pooling()
  }

  set_and_play() {
    this.set_ele_time(this.current_time)
    if (!this.from_negative) this.ele?.play()
    this.paused = false
    this.last = performance.now()
  }

  set_ele_time(v: ms) {
    if (this.ele) {
      this.ele.currentTime = Math.max(v / 1000, 0)
    }
  }

  on_can_play_through(cb: () => void, options?: AddEventListenerOptions) {
    if (this.ele) this.ele.addEventListener('canplaythrough', cb, options)
    else console.warn('Trying to setting can-play-through callback on a empty audio!')
  }

  on_end(cb: () => void, options?: AddEventListenerOptions){
    if (this.ele) this.ele.addEventListener('ended', cb, options)
    else console.warn('Trying to setting end callback on a empty audio!')
  }

  load_url(url: string) {
    this.ele = new Audio(url)
  }

  pause() {
    this.ele?.pause()
    this.paused = true
    this.set_ele_time(0)
  }

  play_pause() {
    if (this.ele) {
      if (this.paused) {
        this.set_and_play()
        this.ended = false
      } else this.pause()
    }
  }

  update() {
    if (!this.paused) {
      if (this.current_time <= 0) {
      const now = performance.now()
      this.set_current_time_from_updater(this.current_time + (now - this.last) * this.play_rate)
      this.last = performance.now()
      } else {
        this.set_current_time_from_updater(this.$ele.currentTime * 1000)
      }
      if (this.from_negative && this.current_time >= 0) {
        this.from_negative = false
        this.set_and_play()
      }
    }
  }

  private set_current_time_from_updater(v: ms) {
    v = Math.floor(Math.min(this.chart.length, Math.max(-5000, v)))
    this._current_time = v
    this.refs.current_ms.value = v
    if (v < 0) this.from_negative = true
    if (this.paused) this.set_ele_time(v)
  }

  init_on_end() {
    this.on_end(() => {this.ended = true})
  }
}
