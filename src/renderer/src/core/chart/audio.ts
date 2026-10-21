import { computed, ref, Ref, WritableComputedRef, watch } from 'vue'
import { Chart } from '@renderer/core/chart/chart'
import { EventHub } from '@renderer/core/misc/eventhub'
import { Intervals } from '@renderer/core/misc/intervals'
import { utils } from '@renderer/core/utils'
import { GlobalStat } from '@renderer/core/globalStat'
import { Storage } from '@renderer/core/storage'

type ms = number
type second = number

/**
 * 音乐音量增益节点（全局单例）。
 * 所有 Chart_audio 的 source 都接到它上面，修改 music_volume 时统一更新。
 * 用单例而非每个 Chart 一份，避免为每张打开的谱面留下一个常驻 gain + watch（会连带留住旧谱的 AudioBuffer）。
 */
let music_gain: GainNode | null = null
function get_music_gain(): GainNode {
  if (!music_gain) {
    const ctx = GlobalStat.audioContext
    music_gain = ctx.createGain()
    music_gain.connect(ctx.destination)
    watch(
      () => Storage.settings.music_volume,
      (v) => {
        if (music_gain) music_gain.gain.value = (v ?? 100) / 100
      },
      { immediate: true }
    )
  }
  return music_gain
}


export class Chart_audio {
  chart: Chart
  buffer: AudioBuffer
  private readonly ctx: AudioContext
  /** 正在播放的 source（时间 >= 0 时存在） */
  private source: AudioBufferSourceNode | null = null
  /** 本次播放的起始 buffer 偏移(ms) */
  private base_offset: ms = 0
  /** 本次播放开始时的 ctx.currentTime(s) */
  private start_ctx_time = 0
  private end_callbacks: (() => void)[] = []
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
  length: ms

  constructor(ch: Chart, buffer: AudioBuffer, length: number) {
    this.chart = ch
    this.buffer = buffer
    this.ctx = GlobalStat.audioContext
    this.length = length
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
    this.refs.play_rate.value = v
    if (this.source) {
      // 变速时先以「旧速率下的当前实际位置」为基准重新锚定，避免 live_time 用新速率回算整段造成偏差
      const pos = this.live_time()
      this.base_offset = pos
      this.start_ctx_time = this.ctx.currentTime
      this.source.playbackRate.setValueAtTime(v || 1, this.ctx.currentTime)
    }
    this._play_rate = v
  }

  _current_time: ms

  get current_time(): ms {
    return this._current_time
  }

  /** 当前实际播放位置（source 播放中时按音频时钟计算） */
  private live_time(): ms {
    if (!this.source) return this._current_time
    return this.base_offset + (this.ctx.currentTime - this.start_ctx_time) * this._play_rate * 1000
  }

  private stop_source() {
    if (!this.source) return
    const src = this.source
    this.source = null
    src.onended = null
    try {
      src.stop()
    } catch {
      /* 已经停止 */
    }
    src.disconnect()
  }

  private start_source(offset_ms: ms) {
    this.stop_source()
    const offset = Math.max(0, Math.min(offset_ms, this.length))
    const src = this.ctx.createBufferSource()
    src.buffer = this.buffer
    src.playbackRate.value = this._play_rate || 1
    src.connect(get_music_gain())
    this.source = src
    this.base_offset = offset
    this.start_ctx_time = this.ctx.currentTime
    src.onended = () => {
      if (this.source !== src) return
      // 自然播放到结尾
      this.source = null
      this._current_time = this.length
      this.refs.current_ms.value = this._current_time
      this.ended = true
      this.end_callbacks.forEach((cb) => cb())
    }
    src.start(0, offset / 1000)
  }

  set_current_time(v: ms) {
    v = Math.floor(utils.clamp(v, -5000, this.length + 3000))
    this.pause()
    this._current_time = v
    this.refs.current_ms.value = v
    this.from_negative = v < 0
    EventHub.dispatch('audio-time-update')
  }

  set_and_play() {
    // AudioContext 可能因自动播放策略处于 suspended，播放前恢复（对打击音同样生效）
    if (this.ctx.state !== 'running') void this.ctx.resume()
    this.from_negative = this.current_time < 0
    if (!this.from_negative) {
      this.start_source(this.current_time)
    }
    this.paused = false
    this.last = performance.now()
    this.chart.hit_sounder?.on_unpause()
    Intervals.pause()
  }

  on_end(cb: () => void) {
    this.end_callbacks.push(cb)
  }

  pause() {
    if (this.source) {
      // 停止前记录精确位置
      this._current_time = Math.min(this.length, Math.max(0, Math.round(this.live_time())))
      this.refs.current_ms.value = this._current_time
    }
    this.stop_source()
    this.paused = true
    Intervals.resume()
  }

  play_pause() {
    if (this.paused) {
      this.set_and_play()
      this.ended = false
    } else {
      this.pause()
    }
  }

  update() {
    if (this.paused) return
    if (this.current_time <= 0 && !this.source) {
      // 负时间倒计时（歌曲真正开始前）
      const now = performance.now()
      this.set_current_time_from_updater(this.current_time + (now - this.last) * this.play_rate)
      this.last = now
    } else {
      this.set_current_time_from_updater(this.live_time())
    }
    if (this.from_negative && this.current_time >= 0) {
      this.from_negative = false
      this.set_and_play()
    }
  }

  init_on_end() {
    this.on_end(() => {
      this.ended = true
    })
  }

  private set_current_time_from_updater(v: ms) {
    v = Math.floor(Math.min(this.length, Math.max(-5000, v)))
    this._current_time = v
    this.refs.current_ms.value = v
    EventHub.dispatch('audio-time-update')
  }
}
