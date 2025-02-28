import { ChartType, HandlerReturn } from '@preload/types'
import ui from '@renderer/core/ui'
import { notify } from '@renderer/core/notify'
import { computed, ComputedRef, ref, Ref, watch, WritableComputedRef } from 'vue'
import { utils } from '@renderer/core/utils'
import Translations from '@renderer/core/translations'
import Storage from '@renderer/core/storage'
import { modal } from '@renderer/core/modal'
import settings from '@renderer/core/settings'

export type Bpm_part = ChartType.Bpm_part

function isBumper(n: ChartType.note | string) {
  if (typeof n == 'string') return ['b', 's', 'mb'].includes(n)
  return ['b', 's', 'mb'].includes(n.n)
}

function sort_diff(diff: ChartType.Diff): void {
  diff.notes.sort((a, b) => {
    if (a.t !== b.t) {
      return a.t - b.t // 按时间排序
    } else {
      // 如果时间相同，将 bpm_note 放在前面
      if (a.n === 'p' && b.n !== 'p') {
        return -1
      } else if (a.n !== 'p' && b.n === 'p') {
        return 1
      } else {
        return 0 // 如果两者都是 bpm_note 或都不是，保持原顺序
      }
    }
  })
}

export class Chart {
  static isBumper = isBumper
  static current: Chart | undefined = undefined
  diff: Ref<ChartType.Diff>
  audio: HTMLAudioElement
  fp: string
  // milli
  length: number
  name: string
  diff_index: Ref<number>
  play_rate_ref: WritableComputedRef<number>
  currentBpm: WritableComputedRef<number>
  currentTimeRef: WritableComputedRef<number>
  bpm_list: ComputedRef<Bpm_part[]>
  visibleTiming: ComputedRef<[number, number]>

  private current_time: Ref<number>
  private play_rate: Ref<number>
  private readonly chart: ChartType.Chart

  constructor(musicPath: string, musicURL: string, name: string) {
    const me = this
    this.chart = Chart.createChart(name)
    this.audio = new Audio(musicURL)
    this.audio.volume = settings.volume.value / 100
    this.length = 0
    this.fp = musicPath
    this.name = name
    document.title = name
    ui.chart_name.value = name
    this.diff_index = ref(0)
    this.diff = ref(this.chart.diffs[this.diff_index.value])
    this.current_time = ref(0)
    this.play_rate_ref = computed({
      get() {
        return me.play_rate.value
      },
      set(v) {
        me.play_back_rate = v
      }
    })
    this.play_rate = ref(1)
    this.bpm_list = computed(() => [{ time: 0, bpm: 0, len: 0 }])
    this.visibleTiming = computed(() => [
      this.current_time.value * 1000 - 2000,
      this.current_time.value * 1000 + ui.windowHeight.value / ui.mul.value + 2000
    ])
    this.currentTimeRef = computed({
      get() {
        return me.current_time.value
      },
      set(val) {
        me.currentTime = val
      }
    })

    this.currentBpm = computed({
      get() {
        return me.bpm_of_time(me.current_time.value * 1000)
      },
      set(v: number) {
        const a = me.diff.value.notes.findLast((x) => {
          return x.n == 'p' ? x.t <= me.current_time.value * 1000 : false
        }) as ChartType.bpm_note | undefined
        if (a) a.v = v
      }
    })

    this.audio.addEventListener('ended', () => {
      this.currentTime = 0
    })
  }

  static get send() {
    return send
  }

  get currentTime() {
    return this.audio.currentTime
  }

  set currentTime(v: number) {
    this.audio.currentTime = Math.max(0, v)
  }

  get play_back_rate() {
    return this.audio.playbackRate
  }

  set play_back_rate(v: number) {
    this.audio.playbackRate = v
    this.play_rate.value = v
  }

  get song() {
    return this.chart.song
  }

  get diffs() {
    return this.chart.diffs
  }

  // n: name
  static createChart(n = ''): ChartType.Chart {
    return {
      song: {
        name: n,
        composer: '/a b30',
        bpm: 120
      },
      diffs: [this.createDiff()]
    }
  }

  static createDiff(): ChartType.Diff {
    return {
      name: 'Finale',
      hard: '14+',
      notes: [{ n: 'p', t: 0, l: 0, v: 120 }],
      charter: 'Terminal Flow',
      offset: 0
    }
  }

  static part_to_note(p: Bpm_part): ChartType.bpm_note {
    return {
      n: 'p',
      t: p.time,
      l: 0,
      v: p.bpm
    }
  }

  static create(musicPath: string, musicURL: string, name: string): Promise<Chart> {
    const chart = new Chart(musicPath, musicURL, name)
    return new Promise((resolve) => {
      chart.audio.addEventListener('canplaythrough', () => {
        chart.post_define()
        resolve(chart)
      })
    })
  }

  post_define() {
    const length = this.audio.duration * 1000
    this.length = length
    this.bpm_list = computed(() => {
      const notes = this.diff.value.notes.filter((x) => x.n == 'p').sort((a, b) => a.t - b.t)
      const x: Bpm_part[] = []
      for (let i = 0; i < notes.length; i++) {
        const pt: Bpm_part = {
          time: notes[i].t,
          bpm: notes[i].v,
          len: length - notes[i].t
        }
        if (x[i - 1]) x[i - 1].len = pt.time - x[i - 1].time
        x.push(pt)
      }
      return x
    })
    this.watchers()
    // me.diff.value = data2notes(me.chart[me.diff_index.value].notes, me.length)
    // watch(me.diff_index, (v) => {
    //   me.diff.value = data2notes(me.chart[v].notes, me.length)
    // })
  }

  watchers() {
    watch(
      this.diff,
      () => {
        this.chart[this.diff_index.value] = this.diff.value
      },
      { deep: true }
    )
    watch(this.diff_index, (v) => {
      this.diff.value = this.chart.diffs[v]
    })
  }

  save() {
    sort_diff(this.diff.value)
    ui.invoke('save-chart', this.fp, JSON.stringify(this.chart))
    Storage.add_proj(this.fp, this.song.name)
  }

  createDiff() {
    this.chart.diffs.push(Chart.createDiff())
    this.diff_index.value += 1
    ui.refresh()
  }

  deleteDiff() {
    if (this.chart.diffs.length == 1) return
    if (confirm(Translations.confirm.del_diff)) this.diffs.splice(this.diff_index.value, 1)
    this.diff_index.value = Math.max(0, this.diff_index.value - 1)
    ui.refresh()
  }

  read_vsb() {
    ui.invoke('ask-vsb')
      .then((r) => {
        if (!r) return
        return ui.invoke('read-vsb', r.path)
      })
      .then((r) => {
        if (!r) return
        modal.ConfirmModal.show({ msg: Translations.confirm.vsb }).then(() => {
          this.diff.value.notes = r
        })
      })
  }

  // true if valid
  valid_check(pending: ChartType.note, unset_hold: boolean = false) {
    if (pending.l < 0 || pending.l > 3) return false
    const minimum = settings.overlap_minimum.value
    return (
      this.diff.value.notes.find((note) => {
        // for bpm notes, simply check if their time are same
        if (note.n == 'p' && pending.n == 'p') {
          return note.t == pending.t
        }
        if (note.n == 'p' || pending.n == 'p') return false
        if (note.l == pending.l) {
          // specially, when setting a newborn hold, t and l are the same
          if (note.n == 'h' && pending.n == 'h' && unset_hold) return false
          if (note.t == pending.t) return true
          if (Math.abs(note.t - pending.t) < minimum) return true

          // 1 check if they're hold and fuck their length (start->end) to assure no overlapping
          if (isBumper(pending)) {
            return false
          }
          if (note.n == 'h')
            return utils.between(pending.t, [note.t - minimum, note.t + note.h + minimum])
          if (pending.n == 'h')
            return utils.between(note.t, [pending.t - minimum, pending.t + pending.h + minimum])
          // check if in certain ms
        }
        if (note.t == pending.t) {
          // 2 check for bumper's overlap
          if (isBumper(note)) return pending.l == note.l || pending.l == note.l + 1
          if (isBumper(pending)) return note.l == pending.l || note.l == pending.l + 1
        }

        return false
      }) == undefined
    )
  }

  bpm_of_time(t: number) {
    const bpm_list = this.bpm_list.value
    for (let i = bpm_list.length - 1; i >= 0; i--) {
      if (t >= bpm_list[i].time) return bpm_list[i].bpm
    }
    throw new Error('null Bpm-part.')
  }

  on_update() {
    this.current_time.value = this.audio.currentTime
    this.play_rate.value = this.audio.playbackRate
  }

  set_chart(ch: ChartType.Chart) {
    utils.assign(this.chart.song, ch.song)
    this.chart.diffs = []
    for (let i = 0; i < ch.diffs.length; i++) {
      const diff = ch.diffs[i]
      this.chart.diffs.push({
        name: diff.name ?? 'Finale',
        hard: diff.hard ?? '14+',
        notes: diff.notes ?? [{ n: 'p', t: 0, l: 0, v: 120 }],
        charter: diff.charter ?? '',
        offset: diff.offset ?? 0
      })
    }
    this.diff_index.value = 0
    this.diff.value = this.chart.diffs[0]
  }
}

const send = {
  open_chart(fp?: string) {
    function cb(file: HandlerReturn.askPath, ch: HandlerReturn.OpenChart) {
      if (!file) return
      if (ch.state == 'missing') {
        notify.error(Translations.notify.music_error)
        Storage.remove_proj(file.path)
        return
      }
      const blob = new Blob([ch.buf], { type: 'audio/*' })
      const url = URL.createObjectURL(blob)

      Chart.create(file.path, url, file.name).then((chart) => {
        ui.chart = chart
        if (ch.state == 'success') chart.set_chart(ch.chart)
        ui.state.value = 'charting'
      })

      ui.state.value = 'cache'
    }

    if (!fp)
      ui.invoke('ask-song').then((file) => {
        if (!file) return
        ui.invoke('open-chart', file.path).then((ch) => {
          cb(file, ch)
        })
        ui.set_state(false)
      })
    else {
      ui.invoke('open-exist-chart', fp).then((r) => {
        if (r.state == 'missing') {
          notify.error(Translations.notify.music_error)
          Storage.remove_proj(fp)
          return
        }
        cb(r, r)
      })
    }
  }
}
