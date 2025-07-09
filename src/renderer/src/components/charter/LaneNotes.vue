<script lang="ts" setup>
import { computed, ComputedRef, ref, toRaw, watch } from 'vue'
import { Chart } from '@renderer/core/chart/chart'
import Note from '@renderer/components/charter/note.vue'
import { ChartType } from '@preload/types'
import { notify } from '@renderer/core/notify'
import Translations from '@renderer/core/translations'
import { utils } from '@renderer/core/utils'
import { Charter } from '@renderer/core/charter'

const chart = Charter.get_chart()
const { meter, note_type, middle, scale } = Charter.settings.to_refs
const { mul } = Charter.refs
const diff = chart.ref.diff

const { current_bpm, shown_timing } = chart
const { chart_current_time } = chart.ref
const { current_ms } = chart.audio.refs
const record_mode = Charter.record.mode
const show_current_bpm = Charter.record.show_bpm
const shown_part = chart.diff.shown
const bpm_list = () => chart.diff.bpm_list.value

// ----

function validBpm(v: any) {
  return isFinite(Number(v)) && Number(v) > 0
}

function bpmGuard(e: Event, init: number) {
  const target = e.target as HTMLInputElement
  if (validBpm(target.value)) return Number(target.value)
  target.value = init.toString()
  return init
}

function setCurrentBpm(e: Event) {
  current_bpm.value = bpmGuard(e, current_bpm.value)
}

function setPartBpm(e: Event, part: ChartType.bpm_part) {
  const bpmValue = bpmGuard(e, part.bpm)
  const n = diff.value.notes.find((x) => {
    return x.n == 'p' ? x.t == part.time : false
  }) as ChartType.bpm_note
  if (n) n.v = bpmValue
}

// -----
const pending = ref({
  lane: 0 as 0 | 1 | 2 | 3,
  display: true,
  type: 'note' as 'note' | 'bpm',
  bpm: current_bpm.value,
  time: 0,
  bottom: 0,
  len: 0
})

const pending_note: ComputedRef<ChartType.note> = computed(() => {
  const note_t = note_type.value
  if (note_t == '') throw new Error('how u fuck it with null note_t')
  if (pending.value.type == 'bpm' || note_t == 'p') {
    return {
      n: 'p',
      t: pending.value.time,
      v: pending.value.bpm,
      l: 0
    }
  } else if (note_t == 'h') {
    return {
      n: 'h',
      t: pending.value.time,
      l: pending.value.lane,
      h: pending.value.len
    }
  } else {
    return {
      n: note_t,
      t: pending.value.time,
      l: pending.value.lane
    }
  }
})

const HoldData = {
  place: ref({
    flag: false,
    // millisecond
    start: 0,
    lane: 0
  }),
  setter: ((_) => {}) as (l: number) => void,
  // Use for not placing a note, clean up the data. After placing, use ``clear()`` instead
  clean() {
    this.place.value.flag = false
    this.place.value.start = 0
    this.place.value.lane = 0
    pending.value.len = 0
    this.cleanUp()
    this.cleanUp = () => {}
  },
  cleanUp: (() => {}) as () => void,
  clear() {
    this.cleanUp = () => {}
    this.clean()
  }
}

function nearest(x: number, y: number) {
  const n = {
    lane: 0,
    // millisecond
    time: 0,
    isBpm: false
  }
  if (x >= 554) {
    n.isBpm = true
    n.lane = 0
    n.time = chart.diff.nearest(y / mul.value + chart_current_time.value, false)
  } else {
    n.isBpm = false
    if (Chart.isBumper(note_type.value)) {
      if (middle.value) n.lane = Math.min(Math.floor(x / 137), 2)
      else n.lane = x < 278 ? 0 : 2
    } else {
      n.lane = Math.min(Math.floor(x / 137), 3)
    }
    n.time = chart.diff.nearest(y / mul.value + chart_current_time.value)
  }
  return n
}

function nearest_note(x: number, y: number): ChartType.note {
  const n = nearest(x, y)
  if (note_type.value == '') throw new Error()
  if (n.isBpm) {
    return {
      n: 'p',
      v: chart.bpm_of_time(n.time)?.bpm ?? 120,
      l: 0,
      t: n.time
    }
  }
  if (note_type.value == 'p') throw new Error()
  if (note_type.value != 'h') {
    return {
      n: note_type.value,
      l: n.lane,
      t: n.time
    }
  } else
    return {
      n: note_type.value,
      l: n.lane,
      t: n.time,
      h: 0
    }
}

function pendingNoteUpdate(e: MouseEvent) {
  if (!e.target) return
  if (!(e.target instanceof HTMLDivElement)) {
    pending.value.display = false
    return
  }
  if (!chart.audio.paused) {
    pending.value.display = false
    return
  }
  if (Charter.record.mode.value) {
    pending.value.display = false
    return
  }
  if (note_type.value == '') return
  const target = e.target as HTMLDivElement
  const x = e.offsetX,
    y = target.clientHeight - e.offsetY

  // target's bottom pos = target.offsetTop + target.scrollHeight
  // here for "n" is the relative value for this certain bpm-box
  const n = nearest(x, y)

  pending.value.type = n.isBpm ? 'bpm' : 'note'
  pending.value.time = n.time
  pending.value.display = n.time >= 0

  if (n.isBpm) HoldData.clean()

  if (HoldData.place.value.flag) {
    n.lane = HoldData.place.value.lane
    pending.value.len = n.time - HoldData.place.value.start
    pending.value.time = HoldData.place.value.start
    pending.value.bottom = HoldData.place.value.start * mul.value - 23
    return
  }
  if (pending.value.type == 'note') {
    // check valid
    pending.value.lane = n.lane as 0 | 1 | 2 | 3
    pending.value.bottom = n.time * mul.value - 23
  } else {
    pending.value.bottom = n.time * mul.value - 23 + 12
  }
  //n.y refers to the bottom-y
  // 42 might refer 1.5rem?
}

function noteAdd(e: MouseEvent) {
  if (!e.target) return
  if (!(e.target instanceof HTMLDivElement)) return

  const t = note_type.value
  if (t == '') return
  const target = e.target as HTMLDivElement

  const note_d: ChartType.note = nearest_note(e.offsetX, target.clientHeight - e.offsetY)
  if (note_d.t < 0) return

  if (t == 'h') {
    if (HoldData.place.value.flag) {
      const len = note_d.t - HoldData.place.value.start
      HoldData.setter(len)
      HoldData.clear()
      return // here returned for the hold-end should not be added as normal-note
    } else {
      HoldData.place.value.flag = true
      watch(note_type, () => HoldData.clean(), { once: true })
      HoldData.place.value.start = note_d.t
      HoldData.place.value.lane = note_d.l
      HoldData.setter = (len: number) => {
        if (len > 0) {
          const h = diff.value.notes.find((x) => {
            return x.n == 'h' ? x.l == note_d.l && x.t == note_d.t : false
          }) as ChartType.hold_note
          if (h) {
            h.h = len
            return
          }
        }
        delNote(note_d)
        notify.error(Translations.notify.note_error)
      }
      HoldData.cleanUp = () => {
        delNote(note_d)
      }
    }
  }
  if (t == 'p') {
    chart.diff.add_bpm(note_d)
    return
  }
  chart.diff.add_note(note_d)
}

function delNote(n: ChartType.note) {
  // part.notes.splice(part.notes.indexOf(n), 1)
  if (HoldData.place.value.flag) {
    HoldData.clean()
    return
  }
  chart.diff.remove_note(n)
}

function delBpmPart(part: ChartType.bpm_part) {
  HoldData.clean()
  const part_note = diff.value.notes.find((x) => {
    return x.n == 'p' ? x.t == part.time && x.v == part.bpm : false
  })
  if (!part_note) return
  const index = bpm_list().indexOf(part)
  if (index == 0) {
    notify.error('第一个不能删哦。')
    return
  }

  chart.diff.remove_bpm(part_note)
}

// -----
const dragFlag = ref(false)
const dragCache = {
  clear: () => {},
  note_data: undefined as ChartType.note | undefined
}

function noteDragStart(note: ChartType.note, e: DragEvent) {
  if (!e.dataTransfer) return
  dragFlag.value = true
  e.dataTransfer.dropEffect = 'move'
  dragCache.note_data = toRaw(note)
  dragCache.clear = () => {
    // part.notes.splice(part.notes.indexOf(note), 1)
    chart.diff.remove_note(note)
  }
}

function drop(e: DragEvent) {
  if (!dragFlag.value) return
  const note = dragCache.note_data as ChartType.note
  const nest = nearest(e.offsetX, (e.target as HTMLDivElement).clientHeight - e.offsetY)
  const new_note = { ...note }
  new_note.t = nest.time
  new_note.l = nest.lane
  dragCache.clear()
  chart.diff.add_note(new_note)

  dragCache.clear = () => {}
  dragCache.note_data = undefined
  dragFlag.value = false
}

function calcBottom(t: number, current: number, h = 0) {
  if (h) return (t + h / 2 - current) * mul.value + 'px'
  return (t - current) * mul.value + 'px'
}

/*function isVisible(n: ChartType.note, visible: [number, number]): boolean {
  if (n.n == 'h') {
    if (utils.between(n.t, visible)) return true
    return n.t + n.h < visible[1]
  }
  return utils.between(n.t, visible)
}*/

function isVisibleBpm(t: number, visible: [number, number]) {
  return utils.between(t, visible)
}

function drawCanvas() {
  chart.drawCanvas()
}

watch(current_ms, drawCanvas)
watch(meter, drawCanvas)
watch(scale, drawCanvas)
</script>

<template>
  <div
    class="note-div"
    @click="(e) => noteAdd(e)"
    @drop="drop"
    @mouseenter="pending.display = true"
    @mouseleave="
      (_) => {
        HoldData.clean()
        pending.display = false
      }
    "
    @mousemove="(e) => pendingNoteUpdate(e)"
    @dragover.prevent
  >
    <Note
      v-if="note_type != '' && pending.type == 'note' && pending.display"
      :note="pending_note"
      :style="{
        bottom: calcBottom(pending_note.t, current_ms, pending_note.n == 'h' ? pending_note.h : 0)
      }"
      :title="pending.time"
      class="pending-note"
      draggable="false"
    />
    <input
      v-if="pending.type == 'bpm'"
      :style="{ bottom: calcBottom(pending_note.t, current_ms) }"
      :value="pending.bpm"
      class="pending-bpm bpm-ticker"
      disabled
    />
    <template v-for="n in shown_part">
      <Note
        :note="n"
        :style="{ bottom: calcBottom(n.t, current_ms, n.n == 'h' ? n.h : 0) }"
        :title="n.t"
        class="normal-note"
        draggable="true"
        @click="(e) => noteAdd(e)"
        @contextmenu="delNote(n)"
        @dragstart="(e) => noteDragStart(n, e)"
      />
    </template>
    <template v-for="part in bpm_list()">
      <input
        v-if="isVisibleBpm(part.time, shown_timing)"
        :style="{ bottom: calcBottom(part.time, current_ms) }"
        :value="part.bpm"
        class="bpm-ticker"
        type="text"
        @change="(e) => setPartBpm(e, part)"
        @contextmenu="delBpmPart(part)"
      />
    </template>
  </div>
  <input
    v-if="record_mode ? show_current_bpm : true"
    :value="current_bpm"
    class="current-bpm bpm-ticker"
    @change="(e) => setCurrentBpm(e)"
  />
</template>
<style scoped>
.normal-note {
  position: absolute;
  transform: translateY(50%);

  pointer-events: all;
}

.pending-note {
  position: absolute;
  pointer-events: none;
  user-select: none;
  opacity: 0.6;
  z-index: var(--z-lane-note-higher);
  transform: translateY(50%);
}

.pending-bpm {
  z-index: var(--z-lane-note-higher);
  user-select: none;
  pointer-events: none;
  transform: translateY(50%);
}

.bpm-ticker {
  position: absolute;
  padding: 0 10px;
  height: 1.5rem;
  width: 30px;
  outline: none;
  box-shadow: #0d1418 0 0 3px;
  display: block;
  background-color: #8d8d8d;
  border: transparent 3px;
  border-top: transparent 15px;
  border-radius: 5px;
  left: 563px;
  text-align: center;
  transform: translateY(50%);
  line-height: 100%;
  font-size: 1.05rem;
  font-weight: bolder;
  pointer-events: all;
  color: white;
}

.current-bpm {
  bottom: var(--h-l-b);
  z-index: var(--z-lane-bottom);
}

::-webkit-scrollbar {
  display: none;
}

.note-div {
  position: absolute;
  height: calc(100% - var(--h-l-b));
  top: 0;
  left: 0;
  z-index: var(--z-lane-note);
  background-color: transparent;
  width: 100%;
}
</style>
