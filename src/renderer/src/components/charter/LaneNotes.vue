<script lang="ts" setup>
import { computed, ComputedRef, ref, toRaw, watch } from 'vue'
import ui from '@renderer/core/ui'
import { Bpm_part, Chart } from '@renderer/core/charter'
import Note from '@renderer/components/charter/note.vue'
import { ChartType } from '@preload/types'
import { notify } from '@renderer/core/notify'
import { EventHub } from '@renderer/core/eventHub'
import Translations from '@renderer/core/translations'
import { utils } from '@renderer/core/utils'

const Language = Translations

const chart = ui.chart as Chart
if (!chart) throw new Error('ui.charter is not defined')
const { meter, scale, note_type, middle } = ui.charter.settings
const { mul, mul_sec } = ui.charter

const { diff, bpm_list, currentBpm, visibleTiming, currentTimeRef } = chart

const bpmBgi = computed(() => (4 / meter.value) * mul_sec.value)

// ----
const wrapper = ref<HTMLDivElement>()

function initScroll() {
  if (!wrapper.value) {
    setTimeout(initScroll, 10)
    return
  }
  const ele = wrapper.value
  ele.scrollTo(0, wrapper.value.scrollHeight)
  ele.style.opacity = '1'
  EventHub.on('update', () => {
    ele.scrollTo({
      top: ele.scrollHeight - currentTimeRef.value * mul_sec.value - ele.offsetHeight
    })
  })

  watch(
    scale,
    () => {
      const totalHeight = 1000 * mul.value * chart.length
      // relatively this is rather inaccurate, so i fucked this
      // const totalHeight = ele.scrollHeight
      const yAt = currentTimeRef.value * mul.value

      ele.scrollTo({ top: totalHeight - yAt })
    },
    { flush: 'post' }
  )
}

initScroll()

function fuckWheel(e: WheelEvent) {
  chart.audio.pause()
  if (!e.target) return
  e.preventDefault()
  const scr = (4 / meter.value) * (60 / currentBpm.value) * Math.sign(e.deltaY)
  currentTimeRef.value -= scr
}

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
  currentBpm.value = bpmGuard(e, currentBpm.value)
}

function setPartBpm(e: Event, part: Bpm_part) {
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
  bpm: currentBpm.value,
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
  // use for not placing a note, cleanup the data. After placing, use ``clear()`` instead
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

function nearest(x: number, y: number, part: ChartType.Bpm_part) {
  const n = {
    lane: 0,
    // millisecond
    time: 0,
    isBpm: false
  }
  const lineHeight = (60 / part.bpm) * (4 / meter.value) * mul_sec.value

  if (x >= 554) {
    n.isBpm = true
    n.lane = 0
    n.time = (Math.floor(y / lineHeight) * lineHeight) / mul.value + part.time
  } else {
    if (Chart.isBumper(note_type.value)) {
      if (middle.value) n.lane = Math.min(Math.floor(x / 137), 2)
      else n.lane = x < 278 ? 0 : 2
    } else {
      n.lane = Math.min(Math.floor(x / 137), 3)
    }
    n.time = (Math.round(y / lineHeight) * lineHeight) / mul.value + part.time
  }
  return n
}

function nearest_note(x: number, y: number, part: Bpm_part): ChartType.note {
  const n = nearest(x, y, part)
  if (note_type.value == '') throw new Error()
  if (n.isBpm) {
    return {
      n: 'p',
      v: chart.bpm_of_time(n.time),
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

function pendingNoteUpdate(e: MouseEvent, p: Bpm_part) {
  if (!e.target) return
  if (!(e.target instanceof HTMLDivElement)) {
    pending.value.display = false
    return
  }
  if (note_type.value == '') return
  const target = e.target as HTMLDivElement
  const x = e.offsetX,
    y = target.clientHeight - e.offsetY

  // target's bottom pos = target.offsetTop + target.scrollHeight
  // here for "n" is the relative value for this certain bpm-box
  const n = nearest(x, y, p)

  pending.value.type = n.isBpm ? 'bpm' : 'note'
  pending.value.time = n.time

  if (n.isBpm) HoldData.clean()

  if (HoldData.place.value.flag) {
    n.lane = HoldData.place.value.lane
    pending.value.len = n.time - HoldData.place.value.start
    pending.value.time = HoldData.place.value.start
    pending.value.display = chart.valid_check(pending_note.value, true)
    pending.value.bottom = HoldData.place.value.start * mul.value - 23
    return
  }
  pending.value.display = chart.valid_check(pending_note.value)
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

function noteAdd(part: Bpm_part, e: MouseEvent) {
  if (!e.target) return
  if (!(e.target instanceof HTMLDivElement)) return

  const t = note_type.value
  if (t == '') return
  const target = e.target as HTMLDivElement

  const note_d: ChartType.note = nearest_note(e.offsetX, target.clientHeight - e.offsetY, part)

  if (t == 'h') {
    if (HoldData.place.value.flag) {
      const len = note_d.t - HoldData.place.value.start
      HoldData.setter(len)
      HoldData.clear()
      return // here returned for the hold-end should not be added as normal-note
    } else {
      if (!chart.valid_check(note_d)) return
      HoldData.place.value.flag = true
      watch(note_type, () => HoldData.clean(), { once: true })
      HoldData.place.value.start = note_d.t
      HoldData.place.value.lane = note_d.l
      HoldData.setter = (len: number) => {
        if (len > 0) {
          const h = diff.value.notes.find((x) => {
            return x.n == 'h' ? x.l == note_d.l && x.t == note_d.t : false
          }) as ChartType.hold_note
          if (h && chart.valid_check({ l: h.l, t: h.t, n: 'h', h: len }, true)) {
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
      return note_d
    }
  }
  if (chart.valid_check(note_d)) return note_d
  return
}

function delNote(n: ChartType.note) {
  // part.notes.splice(part.notes.indexOf(n), 1)
  if (HoldData.place.value.flag) {
    HoldData.clean()
    return
  }
  diff.value.notes.splice(diff.value.notes.indexOf(n), 1)
}

function addBpmPart(part: Bpm_part, e: MouseEvent) {
  if (!e.target) return
  if (!(e.target instanceof HTMLDivElement)) return
  const x = e.offsetX,
    y = e.target.clientHeight - e.offsetY
  const n = nearest(x, y, part)

  const new_part: ChartType.note = {
    t: n.time,
    v: part.bpm,
    n: 'p',
    l: 0
  }
  if (chart.valid_check(new_part)) diff.value.notes.push(new_part)
  return
}

function delBpmPart(part: Bpm_part) {
  console.log(114514)
  HoldData.clean()
  const part_note = diff.value.notes.find((x) => {
    return x.n == 'p' ? x.t == part.time && x.v == part.bpm : false
  })
  if (!part_note) return
  const index = bpm_list.value.indexOf(part)
  if (index == 0) {
    notify.error('第一个不能删哦。')
    return
  }

  diff.value.notes.splice(diff.value.notes.indexOf(part_note), 1)
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
    diff.value.notes.splice(diff.value.notes.indexOf(note), 1)
  }
}

function bpmPartDrop(part: Bpm_part, e: DragEvent) {
  if (!dragFlag.value) return
  const note = dragCache.note_data as ChartType.note
  const nest = nearest(e.offsetX, (e.target as HTMLDivElement).clientHeight - e.offsetY, part)
  const new_note = { ...note }
  new_note.t = nest.time
  new_note.l = nest.lane
  if (chart.valid_check(new_note)) {
    dragCache.clear()
    diff.value.notes.push(new_note)
  } else {
    notify.error(Language.notify.move_error)
  }
  dragCache.clear = () => {}
  dragCache.note_data = undefined
  dragFlag.value = false
}

function calcBottom(t: number, h = 0) {
  if (h) return (t + h / 2 - currentTimeRef.value * 1000) * mul.value + 'px'
  return (t - currentTimeRef.value * 1000) * mul.value + 'px'
}

function isVisible(n: ChartType.note): boolean {
  if (n.n == 'h') {
    if (utils.between(n.t, visibleTiming.value)) return true
    return utils.between(n.t + n.h, visibleTiming.value)
  }
  return utils.between(n.t, visibleTiming.value)
}
function isVisibleBpm(t: number) {
  return utils.between(t, visibleTiming.value)
}
</script>

<template>
  <div
    ref="wrapper"
    class="notes-wrapper"
    style="opacity: 0"
    @mouseenter="pending.display = true"
    @mouseleave="
      (_) => {
        HoldData.clean()
        pending.display = false
      }
    "
    @wheel="fuckWheel"
  >
    <div class="lane-notes">
      <Note
        v-if="note_type != '' && pending.display && pending.type == 'note'"
        :note="pending_note"
        :style="{ bottom: pending.bottom + 'px' }"
        class="pending-note"
        draggable="false"
      />
      <input
        v-if="pending.type == 'bpm' && pending.display"
        :style="{ bottom: pending.bottom + 'px' }"
        :value="pending.bpm"
        class="pending-bpm bpm-ticker"
        disabled
      />
      <div
        v-for="part in bpm_list"
        :style="{
          height: mul * part.len + 'px',
          'background-size': `100% ${(bpmBgi * 60) / part.bpm}px `
        }"
        class="lane-bpm-listed"
        @click="
          (e) => {
            if (pending.type == 'note') {
              const d = noteAdd(part, e)
              if (d) diff.notes.push(d)
            } else {
              addBpmPart(part, e)
            }
          }
        "
        @drop="(e) => bpmPartDrop(part, e)"
        @mousemove="(e) => pendingNoteUpdate(e, part)"
        @dragover.prevent
      >
      </div>
    </div>
  </div>
  <div class="note-div">
    <template v-for="n in diff.notes">
      <Note
        v-if="isVisible(n)"
        :note="n"
        :style="{ bottom: calcBottom(n.t, n.n == 'h' ? n.h : 0) }"
        draggable="true"
        style="position: absolute; transform: translateY(50%)"
        @contextmenu="delNote(n)"
        @dragstart="(e) => noteDragStart(n, e)"
      />
    </template>
    <template v-for="part in bpm_list">
      <input
        :value="part.bpm"
        class="bpm-ticker"
        type="text"
        @change="(e) => setPartBpm(e, part)"
        @contextmenu="delBpmPart(part)"
        :style="{bottom: calcBottom(part.time)}"
        v-if="isVisibleBpm(part.time)"
      >
    </template>
  </div>
  <input :value="currentBpm" class="current-bpm bpm-ticker" @change="(e) => setCurrentBpm(e)" />
</template>
<style scoped>
.pending-note {
  position: absolute;
  pointer-events: none;
  user-select: none;
  opacity: 0.6;
}

.pending-bpm {
  z-index: 1;
  user-select: none;
  pointer-events: none;
  transform: unset !important;
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
}

.current-bpm {
  bottom: var(--h-l-b);
  z-index: 114514;
}

.lane-bpm-listed {
  width: 100%;
  background-position: bottom;
  background-repeat: repeat-y;
  position: relative;
  bottom: 0;
  background-image: linear-gradient(to top, #8d8d8d 3px, transparent 3px);
}

.lane-bpm-ticker {
  bottom: 0;
}

.lane-notes {
  position: relative;
  top: 0;
  z-index: 0;
  width: 100%;
  display: flex;
  flex-direction: column-reverse;
  border-bottom: transparent solid;
  border-bottom-width: calc(var(--h-l-b));
  background-color: transparent;
}

.notes-wrapper {
  height: calc(100%);
  position: absolute;
  top: 0;
  overflow: auto;
  width: 100%;
  z-index: 10;
}

::-webkit-scrollbar {
  display: none;
}

.note-div {
  position: absolute;
  height: calc(100% - var(--h-l-b));
  top: 0;
  left: 0;
  z-index: 101;
  background-color: transparent;
  width: 100%;
  pointer-events: none;
}
</style>
