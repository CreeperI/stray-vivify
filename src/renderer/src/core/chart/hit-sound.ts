import { Chart } from '@renderer/core/chart/chart'
import { Ref, watch } from 'vue'
import { ChartTypeV2 } from '@preload/types'
import { FrameRate } from '@renderer/core/frame-rates'
import { Settings } from '@renderer/core/settings'
import { utils } from '@renderer/core/utils'
import { notify } from '@renderer/core/notify'

export class HitSoundSystem {
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
    // here 1.5 as sometimes it shits
    const hitNote = this.shown.value.find(
      (x: any) => utils.between(x.time, [current, current + delta_time * 1.4]) && x['snm'] != 1
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
      watch(
        () => Settings.editor.hit_volume,
        (v) => {
          if (this.gainNode) this.gainNode.gain.value = v / 100
          else notify.error('GainNode炸了')
        }
      )
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
