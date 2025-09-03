<script lang="ts" setup>
import NoteV2 from '@renderer/components/chart-v2/note-v2.vue'
import { computed, MaybeRef, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChartTypeV2 } from '@preload/types'
import { Settings } from '@renderer/core/settings'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'

const chart = Chart.$current
// const force_playing = ref(false)
const not_playing_class = computed(
  () =>
    // chart.audio.refs.paused.value && !force_playing.value ? 'not-playing' : ''
    ''
)
const lane_width = Settings.editor.lane_width
const svg_width = 4 * lane_width + 2 * 50 + 12
const offset1 = Settings.editor.offset1

const { shown } = defineProps<{ shown: MaybeRef<ChartTypeV2.note[]> }>()
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms

// ------------ pending --------------
const pending_time = ref(0)
const pending_lane = ref(0)
const pending_snm = ref(0)
const pending_len = ref(0)
const pending_display = ref(false)
const dragging = ref<ChartTypeV2.note>()
let pending_hold_fixed = false
let pending_hold_fixed_time = 0
const pending_note = computed(() => {
  if (dragging.value) {
    return {
      ...dragging.value,
      time: pending_time.value,
      lane: pending_lane.value
    }
  }
  return Settings.note.h
    ? ({
        time: pending_time.value,
        lane: pending_lane.value,
        width: Settings.note.w,
        ani: [],
        len: pending_len.value
      } as ChartTypeV2.hold_note)
    : ({
        time: pending_time.value,
        lane: pending_lane.value,
        width: Settings.note.w,
        ani: [],
        snm: pending_snm.value
      } as ChartTypeV2.normal_note)
})

watch(chart.audio.refs.paused, (v) => {
  if (!v) {
    pending_display.value = false
    pending_hold_fixed = false
  }
})

function update_pending_display(_trigger: 'enter' | 'leave' | 'note') {
  if (GlobalStat.chart_state.value != 0) return
  if (Settings.note.w == 0) pending_display.value = false
  else if (_trigger == 'note') {
    if (pending_hold_fixed) return
    pending_display.value = false
  } else if (_trigger == 'enter') pending_display.value = true
  else if (_trigger == 'leave') {
    pending_display.value = false
    pending_hold_fixed = false
  }
}

function update_pending(e: MouseEvent) {
  if (GlobalStat.chart_state.value != 0) return
  if (Settings.note.w == 0) return
  if (!chart.audio.paused) return
  if (e.target instanceof HTMLImageElement) {
    return
  }
  // initially here should be -80 but considering the transform of the beat lines that sucks
  // so i just made it -100
  const bottom = screen.availHeight - 100 - e.offsetY
  const mouse_time = Math.floor(chart.diff.nearest(bottom / mul.value + current_time.value))
  if (pending_hold_fixed) {
    pending_len.value = Math.abs(mouse_time - pending_hold_fixed_time)
    if (mouse_time <= pending_hold_fixed_time) {
      // so the user is 倒着拉条
      pending_time.value = pending_hold_fixed_time - pending_len.value
      console.log(pending_time.value)
    }
    return
  }
  // this is initial value referring the % of the mouse
  let lane: number = e.offsetX / svg_width
  switch (dragging.value ? dragging.value.width : Settings.note.w) {
    case 2:
      let lane2 = lane * 4
      if (lane2 < 1.5) lane = 0
      else if (lane2 > 2.5) lane = 2
      else lane = 1
      break
    case 3:
      lane = Math.round(lane)
      break
    case 4:
      lane = 0
      break
    default:
      lane = Math.floor(lane * 4)
  }
  pending_time.value = mouse_time
  pending_lane.value = lane
  pending_snm.value = Settings.note.snm

  pending_display.value = pending_time.value >= 0
}

function on_click() {
  if (GlobalStat.chart_state.value != 0) return
  if (Settings.note.w == 0) return
  if (Settings.note.hold.value) {
    if (pending_hold_fixed) {
      chart.diff.add_note(pending_note.value)
      pending_len.value = 0
      pending_hold_fixed = false
    } else {
      pending_hold_fixed = true
      pending_hold_fixed_time = pending_time.value
    }
    return
  } else chart.diff.add_note(pending_note.value)
}

function del_note(n: ChartTypeV2.note) {
  chart.diff.remove_note(n)
}

const opacity = computed(() => {
  if (dragging.value == undefined) return 0.7
  else return 1
})

const _tp_img = document.createElement('img')
_tp_img.src = ''
function ondragstart(e: DragEvent, n: ChartTypeV2.note) {
  console.log('start')
  dragging.value = n
  pending_hold_fixed = false
  pending_len.value = 0
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    e.dataTransfer.setDragImage(_tp_img, 0, 0)
  }
}
function ondragend() {
  console.log('end')
  dragging.value = undefined
}
function ondrop() {
  if (!dragging.value) return
  if (chart.diff.add_note_no_undo(pending_note.value)) chart.diff.remove_note(dragging.value)

  dragging.value = undefined
}

// ------------------ renderer functions -------------
function time_bottom(t: number, note: ChartTypeV2.note, _mul: number) {
  // if (note.n == 'h')
  //   return (note.t + note.h / 2 - t) * _mul + 'px'
  // else
  return (note.time - t - offset1) * _mul + 'px'
}

function x_of(note: ChartTypeV2.note) {
  return note.lane * lane_width + 6 + 'px'
}
function fuck_wheel(e: WheelEvent) {
  if (GlobalStat.chart_state.value != 0) return
  if (e.ctrlKey || e.altKey) return
  chart.audio.pause()
  if (!e.target) return

  const current_time = chart.audio.current_time
  const meter = Settings.editor.meter
  const current_bpm = chart.diff.bpm_of_time(current_time)?.bpm ?? 120

  chart.audio.set_current_time(chart.diff.nearest(current_time))
  const scr = Math.round((4 / meter) * (60 / current_bpm) * Math.sign(e.deltaY) * 1000)
  if (Settings.editor.reverse_scroll) {
    chart.audio.set_current_time(chart.audio.current_time + scr)
  } else {
    chart.audio.set_current_time(chart.audio.current_time - scr)
  }
}
onMounted(() => {
  let id = setInterval(() => {
    const lw = document.getElementById('lane-wrapper')
    if (!lw) return
    lw.addEventListener('wheel', fuck_wheel)
    clearInterval(id)
  }, 500)
  chart.diff.fuck_shown(0, true)
})
onUnmounted(() => {
  document.getElementById('lane-wrapper')?.removeEventListener('wheel', fuck_wheel)
})

const pointer_class = computed(() => {
  return dragging.value != undefined ? 'pt-dragging' : ''
})
</script>

<template>
  <g
    id="svg-notes"
    :class="not_playing_class"
    @mouseenter="() => update_pending_display('enter')"
    @mouseleave="() => update_pending_display('leave')"
  >
    <foreignObject
      :class="pointer_class"
      id="lane-notes"
      height="100%"
      width="100%"
      x="50"
      y="-80"
      @click="on_click"
      @mousemove.capture="update_pending"
      @drop="ondrop"
      @dragover.prevent="update_pending"
    >
      <note-v2
        v-for="note in shown"
        :note="note"
        :style="{
          bottom: time_bottom(current_time, note, mul),
          left: x_of(note)
        }"
        data-shown-note
        @click.right="del_note(note)"
        @dragstart="(e) => ondragstart(e, note)"
        @dragend="ondragend"
        :data-is-dragged="dragging == note"
      />
      <note-v2
        v-if="pending_display"
        :note="pending_note"
        :style="{
          bottom: time_bottom(current_time, pending_note, mul),
          left: x_of(pending_note),
          opacity: opacity
        }"
        style="pointer-events: none; z-index: 10"
      />
    </foreignObject>
  </g>
</template>

<style scoped>
.not-playing > * > img[data-shown-note] {
  transition: bottom 0.1s cubic-bezier(0, 0, 0, 0.7);
}
.pt-dragging {
  cursor: grabbing;
}
</style>
