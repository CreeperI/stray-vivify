import { ref, ToRefs, watch } from 'vue'
import { ChartType } from '@preload/types'
import { Chart } from '@renderer/core/chart/chart'


export class Chart_song {
  refs: ToRefs<ChartType.song>
  chart: Chart

  constructor(ch: Chart, name?: string, composer?: string, bpm?: string) {
    this.chart = ch
    this._name = ''
    this._composer = ''
    this._bpm = '120'
    if (name) this._name = name
    if (composer) this._composer = composer
    if (bpm) this._bpm = bpm
    this.refs = {
      name: ref(this._name),
      composer: ref(this._composer),
      bpm: ref(this._bpm)
    }

    watch(this.refs.name, (v) => (this.name = v))
    watch(this.refs.composer, (v) => (this.composer = v))
    watch(this.refs.bpm, (v) => (this.bpm = v))
  }

  _name: string

  get name() {
    return this._name
  }

  set name(v: string) {
    this._name = v
  }

  _composer: string

  get composer() {
    return this._composer
  }

  set composer(v: string) {
    this._composer = v
  }

  _bpm: string

  get bpm() {
    return this._bpm
  }

  set bpm(v: string) {
    this._bpm = v
  }

  static createSong(): ChartType.song {
    return {
      name: 'Termiant',
      composer: 'Astella vs Estral.tf',
      bpm: '114'
    }
  }

  set_song(v: ChartType.song) {
    this.name = v.name
    this.composer = v.composer
    this.bpm = v.bpm
  }

  save(): ChartType.song {
    return {
      name: this.name,
      composer: this.composer,
      bpm: this.bpm
    }
  }
}
