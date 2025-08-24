import { Ref, ref, watch } from 'vue'
import { ChartTypeV2 } from '@preload/types'
import { Chart } from '@renderer/core/chart/chart'

function roman_need(str: string) {
  return /[^\u0000-\u007F]/u.test(str)
}
export class Chart_song {
  refs: Ref<ChartTypeV2.song>
  chart: Chart
  need_roman: Ref<[boolean, boolean]>

  constructor(ch: Chart) {
    this.chart = ch
    this._name = ''
    this._name_roman = ''
    this._composer = ''
    this._composer_roman = ''
    this._bpm = '120'
    this._source = ''
    this._ref = ''
    this._sprite = ''
    this.need_roman = ref([false, false])


    this.refs = ref({
      name: '',
      name_roman: '',
      composer: '',
      composer_roman: '',
      bpm: '120',
      source: '',
      ref: '',
      sprite: ''
    })

    watch(
      this.refs,
      (v) => {
        this._name = v.name
        this._composer = v.composer
        this._bpm = v.bpm
        this._source = v.source
        this._ref = v.ref
        this._sprite = v.sprite
        this.need_roman.value = [roman_need(v.name), roman_need(v.composer)]
        this.name_roman = v.name.replace(/[^\u0000-\u007F]/gu, '')
        this.composer_roman = v.composer.replace(/[^\u0000-\u007F]/gu, '')
        ch.set_header_name()
      },
      { deep: true, flush: 'sync' },
    )
  }

  _name: string

  get name() {
    return this._name
  }

  set name(v: string) {
    this._name = v
    this.refs.value.name = v
    this.chart.set_header_name()
  }

  _composer: string

  get composer() {
    return this._composer
  }

  set composer(v: string) {
    this._composer = v
    this.refs.value.composer = v
  }

  _bpm: string

  get bpm() {
    return this._bpm
  }

  set bpm(v: string) {
    this._bpm = v
    this.refs.value.bpm = v
  }

  _name_roman: string
  get name_roman() {
    return this._name_roman
  }

  set name_roman(v: string) {
    this._name_roman = v
    this.refs.value.name_roman = v
  }

  _composer_roman: string
  get composer_roman() {
    return this._composer_roman
  }

  set composer_roman(v: string) {
    this._composer_roman = v
    this.refs.value.composer_roman = v
  }

  _ref: string
  get ref() {
    return this._ref
  }

  set ref(v: string) {
    this._ref = v
    this.refs.value.ref = v
  }

  _source: string
  get source() {
    return this._source
  }

  set source(v: string) {
    this._source = v
    this.refs.value.source = v
  }

  _sprite: string
  get sprite() {
    return this._sprite
  }
  set sprite(v: string) {
    this._sprite = v
    this.refs.value.sprite = v
  }

  set_song(v: ChartTypeV2.song) {
    this.name = v.name
    this.composer = v.composer
    this.bpm = v.bpm
    this.name_roman = v.name_roman
    this.composer_roman = v.composer_roman
    this.ref = v.ref
    this.sprite = v.sprite
  }

  save(): ChartTypeV2.song {
    return {
      name: this.name,
      composer: this.composer,
      bpm: this.bpm,
      name_roman: this.name_roman,
      composer_roman: this.composer_roman,
      ref: this.ref,
      source: this.source,
      sprite: this.sprite
    }
  }
}
