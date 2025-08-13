import { ref, ToRefs, watch } from 'vue'
import { ChartTypeV2 } from '@preload/types'
import { Chart } from '@renderer/core/chart/chart'

export class Chart_song {
  refs: ToRefs<ChartTypeV2.song>
  chart: Chart

  constructor(ch: Chart) {
    this.chart = ch
    this._name = ''
    this._name_roman = ''
    this._composer = ''
    this._composer_roman = ''
    this._bpm = '120'
    this._source = ''
    this._ref = ''

    this.refs = {
      name: ref(this._name),
      name_roman: ref(''),
      composer: ref(this._composer),
      composer_roman: ref(''),
      bpm: ref(this._bpm),
      source: ref(''),
      ref: ref('')
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
    this.refs.name.value = v
  }

  _composer: string

  get composer() {
    return this._composer
  }

  set composer(v: string) {
    this._composer = v
    this.refs.composer.value = v
  }

  _bpm: string

  get bpm() {
    return this._bpm
  }

  set bpm(v: string) {
    this._bpm = v
    this.refs.bpm.value = v
  }

  _name_roman: string
  get name_roman() {
    return this._name_roman
  }

  set name_roman(v: string) {
    this._name_roman = v
    this.refs.name_roman.value = v
  }

  _composer_roman: string
  get composer_roman() {
    return this._composer_roman
  }

  set composer_roman(v: string) {
    this._composer_roman = v
    this.refs.composer_roman.value = v
  }

  _ref: string
  get ref() {
    return this._ref
  }

  set ref(v: string) {
    this._ref = v
    this.refs.ref.value = v
  }

  _source: string
  get source() {
    return this._source
  }

  set source(v: string) {
    this._source = v
    this.refs.source.value = v
  }

  set_song(v: ChartTypeV2.song) {
    this.name = v.name
    this.composer = v.composer
    this.bpm = v.bpm
    this.name_roman = v.name_roman
    this.composer_roman = v.composer_roman
    this.ref = v.ref
  }

  save(): ChartTypeV2.song {
    return {
      name: this.name,
      composer: this.composer,
      bpm: this.bpm,
      name_roman: this.name_roman,
      composer_roman: this.composer_roman,
      ref: this.ref,
      source: this.source
    }
  }
}
