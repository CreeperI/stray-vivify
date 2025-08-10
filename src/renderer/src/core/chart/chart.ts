import { ChartType, ChartTypeV2, Invoke } from '@preload/types'
import { notify } from '@renderer/core/notify'
import { computed, ComputedRef, ref, Ref, watch, WritableComputedRef } from 'vue'
import Translations from '@renderer/core/translations'
import { Charter } from '@renderer/core/charter'
import { Chart_audio } from '@renderer/core/chart/chart_audio'
import { Chart_song } from '@renderer/core/chart/chart_song'
import { Chart_diff } from './Chart_diff'
import { GlobalStat } from '@renderer/core/globalStat'
import { Settings } from '@renderer/core/Settings'

function isBumper(n: ChartType.note | string) {
  if (typeof n == 'string') return ['b', 's', 'mb'].includes(n)
  return ['b', 's', 'mb'].includes(n.n)
}

export type ms = number

export class Chart {
  static current: Chart | undefined = undefined
  static isBumper = isBumper
  song: Chart_song
  diffs: ChartTypeV2.diff[]
  path: string
  audio: Chart_audio
  diff: Chart_diff
  length: number
  shown_timing: ComputedRef<[ms, ms]>
  current_bpm: WritableComputedRef<number>
  ref: {
    diff_index: Ref<number>
    diff: Ref<ChartTypeV2.diff>
    chart_current_time: Ref<number>
  }
  canvas_data: {
    height: number
  }
  id: string

  constructor() {
    this.song = new Chart_song(this)
    this.diffs = [Chart_diff.createDiff()]
    this._diff_index = 0
    this.audio = new Chart_audio(this)
    this.path = ''
    this.length = -1
    this.canvas_data = {
      height: 0
    }
    this.shown_timing = computed(() => [
      this.audio.refs.current_ms.value,
      this.audio.refs.current_ms.value + Charter.refs.visible.value
    ])
    const me = this
    this.current_bpm = computed({
      get() {
        return me.bpm_of_time(me.audio.refs.current_ms.value)?.bpm ?? 120
      },
      set(v) {
        const n = me.diff.timing.findLast((tp) => tp.time <= me.audio.current_time)
        if (n) n.bpm = v
      }
    })
    this.ref = {
      diff_index: ref(0),
      diff: ref(this.diffs[0]),
      chart_current_time: ref(0)
    }
    this.diff = new Chart_diff(this)
    this.id = ''
  }

  _diff_index: number

  get diff_index() {
    return this._diff_index
  }

  set diff_index(v: number) {
    this.ref.diff_index.value = v
    this.ref.diff.value = this.diffs[this.ref.diff_index.value]
    this._diff_index = v
    Charter.update()
  }

  get visible_timing() {
    return this.audio.current_time + Charter.refs.visible.value
  }

  get chart(): ChartTypeV2.final {
    return {
      song: this.song.save(),
      diffs: this.diffs,
      version: Settings.version
    }
  }

  static createChart(n = ''): ChartTypeV2.final {
    return {
      song: {
        name: n,
        name_roman: n,
        composer: '/a b30',
        composer_roman: '/a b30',
        bpm: '120',
        source: 'stray-vivify',
        ref: ''
      },
      diffs: [Chart_diff.createDiff()],
      version: Settings.version
    }
  }

  static create(musicPath: string, musicURL: string, name: string): Promise<Chart> {
    const chart = new Chart()
    chart.audio.load_url(musicURL)
    chart.set_path(musicPath)
    chart.set_name(name)
    return new Promise((resolve) => {
      chart.audio.on_can_play_through(
        () => {
          chart.post_define()
          resolve(chart)
        },
        { once: true }
      )
    })
  }

  /*static create_vsb(vsb_path: string): Promise<Chart> {
    const chart = new Chart()
    chart.set_path(vsb_path)
    return new Promise((resolve, reject) => {
      Charter.invoke('read-vsb', vsb_path).then((r) => {
        if (!r) {
          reject('')
          return
        }
        chart.diff.set_notes(r)
        resolve(chart)
      })
    })
  }*/

  static async open_chart(id: string) {
    Charter.record.mode.value = false
    Charter.state.value = 'cache'
    Charter.load_state.clear()
    Charter.load_state.data.value.asked_path = 'success'

    const file = await Charter.invoke('open-song', id)
    Charter.load_state.data.value.load_music_from_backend = 'success'
    const blob_path = URL.createObjectURL(await this.fetch_blob(file.path))
    const chart = await this.create(id, blob_path, id)
    if (file.data) {
      const data = this.parse_data(file.data)
      if (data.status == 'converted') {
        await Charter.invoke('backup-chart', id, file.data)
        notify.normal('')
      }
      chart.set_chart(data.data)
      chart.set_name(data.data.song.name)
    }
    Charter.load_state.data.value.waiting_can_play = 'success'
    chart.id = id
    this.current = chart
    Charter.state.value = 'charting'
    watch(
      Charter.refs.state,
      () => {
        chart.audio.pause()
      },
      { once: true }
    )
  }

  static async fetch_blob(path: string) {
    const r = await fetch('stray:/__song__/' + path)
    if (r.ok) return await r.blob()
    throw new Error('what fetch failed')
  }

  static parse_data(data: string): { data: ChartTypeV2.final; status: 'converted' | 'loaded' } {
    const parsed = JSON.parse(data) as ChartType.Chart | ChartTypeV2.final
    if ('version' in parsed) {
      return {
        data: parsed,
        status: 'loaded'
      }
    } else {
      // for the old versions
      const new_data = this.createChart()
      new_data.diffs.pop()

      parsed.diffs.forEach((d) => new_data.diffs.push(this.parse_old_diff(d)))
      new_data.song.name = parsed.song.name
      new_data.song.name_roman = parsed.song.name
      new_data.song.composer = parsed.song.composer
      new_data.song.composer_roman = parsed.song.composer
      new_data.song.bpm = parsed.song.bpm
      return {
        data: new_data,
        status: 'converted'
      }
    }
  }

  static parse_old_diff(dif: ChartType.Diff): ChartTypeV2.diff {
    const new_diff = Chart_diff.createDiff()
    new_diff.timing = []
    dif.notes.forEach((note) => {
      if (note.n == 'p') {
        new_diff.timing.push({
          time: note.t,
          bpm: note.v,
          num: 4,
          den: 4
        })
      } else new_diff.notes.push(note)
    })
    new_diff.meta.diff1 = dif.name
    new_diff.meta.diff2 = dif.hard
    new_diff.meta.charter = dif.charter
    return new_diff
  }

  load_vsb(r: Invoke['read-vsb']['r']) {
    if (!r) return
    Charter.modal.ConfirmModal.show({ msg: Translations.confirm.vsb }).then(() => {
      this.diff.set_notes(r[0])
      this.diff.set_timing(r[1])
      this.fuck_shown(true)
      this.diff.update_diff_counts()
    })
  }

  fuck_shown(force = false) {
    this.diff.fuck_shown(this.audio.current_time, force)
  }

  set_path(p: string) {
    this.path = p
  }

  set_name(n: string) {
    this.song.name = n
  }

  post_define() {
    this.length = (this.audio.ele?.duration ?? -1) * 1000
    Charter.refs.current_name.value = this.song.name
    watch(
      this.ref.diff,
      () => {
        this.diffs[this.ref.diff_index.value] = this.ref.diff.value
      },
      { deep: true }
    )
    watch(this.ref.diff_index, () => {
      this.ref.diff.value = this.diffs[this.ref.diff_index.value]
      this.fuck_shown()
    })
    watch(this.audio.refs.current_ms, () => {
      this.fuck_shown()
      this.ref.chart_current_time.value = this.audio.refs.current_ms.value
    })
    setTimeout(() => {
      this.fuck_shown(true)
    }, 500)
  }

  create_diff() {
    this.diffs.push(Chart_diff.createDiff())
    this.diff_index = this.diffs.length - 1
  }

  delete_diff() {
    Charter.modal.ConfirmModal.show({ msg: Translations.confirm.del_diff }).then(() => {
      this.diffs.splice(this.diff_index, 1)
      this.diff_index = 0
    })
  }

  bpm_of_time(time: ms) {
    return this.diff.bpm_of_time(time)
  }

  set_chart(v: ChartTypeV2.final) {
    this.song.set_song(v.song)
    this.diffs = v.diffs
    // this.diff.set_diff(this.diffs[this.diff_index])
    this.diff_index = 0
  }

  on_update() {
    this.audio.update()
  }

  save() {
    if (this.audio.ele) {
      this.diff.floor_time()
      Charter.invoke('save-chart', this.id, JSON.stringify(this.chart))
      Charter.invoke(
        'update-chart-data',
        this.id,
        JSON.stringify({
          song: this.song.save(),
          diffs: this.diffs.map((x) => x.meta.diff1 + ' ' + x.meta.diff2)
        })
      ).then(() => {
        GlobalStat.update_all_chart()
      })
    }
  }

  write_current_vsc() {
    Charter.invoke('write-vsc', this.id, this.diff.to_vsc().join('\n'), this.diff.diff1).then(() =>
      notify.success('已导出为vsc!!!!!!!')
    )
  }
}

// @ts-ignore
window.chart = Chart
