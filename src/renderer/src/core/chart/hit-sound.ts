import { Chart } from '@renderer/core/chart/chart'
import { Ref, watch } from 'vue'
import { Storage } from '@renderer/core/storage'
import { utils } from '@renderer/core/utils'
import { notify } from '@renderer/core/misc/notify'

export class HitSoundSystem {
  private hit_error = false
  private audioContext: AudioContext | null = null
  private audioBuffer: AudioBuffer | null = null
  private gainNode: GainNode | null = null
  private maxVoices = 64
  private activeVoices: Array<{ source: AudioBufferSourceNode; endTime: number }> = []
  private chart: Chart
  private shown: Ref<number[]>
  private last_trigger: number

  constructor(chart: Chart, shown: Ref<number[]>) {
    this.chart = chart
    this.shown = shown
    this.initWebAudio()
    this.last_trigger = -Infinity
  }

  on_unpause() {
    this.last_trigger = this.chart.audio.current_time
  }

  public async play_hit() {
    if (this.hit_error || !this.audioBuffer || !this.audioContext || !this.gainNode) {
      return
    }

    const now = this.audioContext.currentTime
    this.activeVoices = this.activeVoices.filter((v) => v.endTime > now)

    const last = this.last_trigger
    const current = this.chart.audio.current_time - Storage.settings.offset3

    // Find note in current time window
    const hitNote = this.shown.value.some(
      (x) => utils.between(this.chart.diff.notes[x].time, [last, current]) && x['snm'] != 1
    )
    this.last_trigger = this.chart.audio.current_time

    if (hitNote) {
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
      } catch (e) {
        console.error('Failed to play sound:', e)
      }
    }
  }

  private async initWebAudio() {
    try {
      this.audioContext = new AudioContext()
      this.gainNode = this.audioContext.createGain()
      watch(
        () => Storage.settings.hit_volume,
        (v) => {
          if (this.gainNode) this.gainNode.gain.value = v / 100
          else notify.error('打击音炸了！')
        },
        {
          immediate: true
        }
      )
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
