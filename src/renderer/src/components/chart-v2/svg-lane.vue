<script setup lang="ts">
import { Settings } from '@renderer/core/Settings'
import { Charter } from '@renderer/core/charter'
import { ChartTypeV2 } from '@preload/types'
import NoteV2 from '@renderer/components/chart-v2/note-v2.vue'
import { computed, ref, watch } from 'vue'

const lane_width = Settings.editor.lane_width
const svg_width = 4 * lane_width + 50 + 12
const view_port = [0, 0, svg_width, window.screen.height]
const _px = svg_width + 'px'

const chart = Charter.get_chart()
const shown = chart.diff.shown
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms
const bb_list = chart.diff.shown_bar_beat

function time_bottom(t: number, note: ChartTypeV2.note, _mul: number) {
  // if (note.n == 'h')
  //   return (note.t + note.h / 2 - t) * _mul + 'px'
  // else
  return (note.time - t) * _mul + 'px'
}

function time_bottom_bar(t: number, time: number, _mul: number) {
  return view_port[3] - (time - t) * _mul - 80
}

function x_of(note: ChartTypeV2.note) {
  return note.lane * lane_width + 6 + 'px'
}

function fuck_wheel(e: WheelEvent) {
  if (e.ctrlKey || e.altKey) return
  chart.audio.pause()
  if (!e.target) return

  const current_time = chart.audio.current_time
  const meter = Settings.editor.meter
  const current_bpm = chart.diff.bpm_of_time(current_time)?.bpm ?? 120

  chart.audio.set_current_time(chart.diff.nearest(current_time))
  const scr = (4 / meter) * (60 / current_bpm) * Math.sign(e.deltaY)
  if (Settings.editor.reverse_scroll) {
    chart.audio.set_current_time(chart.audio.current_time + scr * 1000)
  } else {
    chart.audio.set_current_time(chart.audio.current_time - scr * 1000)
  }
  update_pending(e)
}

function del_note(n: ChartTypeV2.note) {
  chart.diff.remove_note(n)
}
const force_playing = ref(false)
const not_playing_class = computed(() =>
  chart.audio.refs.paused.value && !force_playing.value ? 'not-playing' : ''
)
// these 2 shown here used to fix fast-moving notes when pos updates
// i wish this works
watch(
  shown,
  () => {
    force_playing.value = true
  },
  { flush: 'pre' }
)
watch(
  shown,
  () => {
    requestAnimationFrame(() => force_playing.value = false)
  },
  { flush: 'post' }
)

const pending_time = ref(0)
const pending_lane = ref(0)
const pending_snm = ref(0)
const pending_len = ref(0)
let pending_hold_fixed = false
let pending_hold_fixed_time = 0
const pending_note = computed(() => {
  if (Settings.note.h) {
    return {
      time: pending_time.value,
      lane: pending_lane.value,
      width: 1,
      ani: [],
      len: pending_len.value
    } as ChartTypeV2.hold_note
  } else {
    return {
      time: pending_time.value,
      lane: pending_lane.value,
      width: Settings.note.w,
      ani: [],
      snm: pending_snm.value
    } as ChartTypeV2.normal_note
  }
})
const pending_display = ref(false)

function update_pending_display(_trigger: 'enter' | 'leave' | 'note') {
  if (Settings.note.w == 0) pending_display.value = false
  else if (_trigger == 'enter') pending_display.value = true
  else if (_trigger == 'leave') {
    pending_display.value = false
    pending_hold_fixed = false
  }
}

function update_pending(e: MouseEvent) {
  if (Settings.note.w == 0) return
  if (e.target instanceof HTMLImageElement) return
  const bottom = screen.availHeight - 80 - e.offsetY
  const mouse_time = chart.diff.nearest(bottom / mul.value + current_time.value)
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
  let lane: number = (e.offsetX - 28) / svg_width
  switch (Settings.note.w) {
    case 2:
      lane = Math.min(Math.floor(lane * 3), 2)
      break
    case 3:
      lane = Math.min(Math.floor(lane * 2), 1)
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

  if (pending_time.value < 0) pending_display.value = false
}

function on_click() {
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

const _editor = Settings.data
</script>

<template>
  <div class="lane-wrapper" :style="{ flexBasis: _px }" @wheel="fuck_wheel">
    <svg
      id="lane-svg"
      :viewBox="view_port.join(' ')"
      preserveAspectRatio="xMidYMax slice"
      :width="svg_width"
      @mouseleave="() => update_pending_display('leave')"
      @mouseenter="() => update_pending_display('enter')"
      :key="_editor.settings.scale"
      :data-1145="_editor.settings.scale"
    >
      <rect x="0" y="0" width="100%" height="100%" fill="#000000"></rect>
      <g>
        <text
          v-for="[line, idx] in bb_list[0]"
          x="25"
          fill="white"
          dy="-1rem"
          font-size="1.2rem"
          :y="time_bottom_bar(current_time, line, mul)"
          text-anchor="middle"
        >
          {{ idx + 1 }}
        </text>
      </g>
      <g transform="translate(50)">
        <rect fill="#131520" x="0" y="0" height="100%" width="100%"></rect>
        <g id="svg-beat-line" transform="translate(0 -20)">
          <line
            v-for="line in bb_list[1]"
            x1="0"
            x2="100%"
            :y1="time_bottom_bar(current_time, line, mul)"
            :y2="time_bottom_bar(current_time, line, mul)"
            stroke="#ffffff"
            stroke-width="5"
          ></line>
        </g>
        <g id="svg-notes" :class="not_playing_class">
          <foreignObject
            height="100%"
            width="100%"
            x="0"
            y="-80"
            @click="on_click"
            @mousemove.capture="update_pending"
          >
            <note-v2
              :note="pending_note"
              :style="{
                bottom: time_bottom(current_time, pending_note, mul),
                left: x_of(pending_note)
              }"
              style="opacity: 0.7; pointer-events: none; z-index: 10"
              v-if="pending_display"
              :data-note="JSON.stringify(pending_note)"
            />
            <note-v2
              :note="note"
              v-for="note in shown"
              :style="{
                bottom: time_bottom(current_time, note, mul),
                left: x_of(note)
              }"
              data-shown-note
              @contextmenu="del_note(note)"
            />
          </foreignObject>
        </g>
        <g id="svg-bar-lines">
          <line x2="100%"></line>
        </g>
        <rect
          fill="#272727"
          x="3"
          y="1000"
          height="80"
          width="100%"
          stroke="#ffffff"
          stroke-width="6"
        ></rect>
        <rect fill="#ffffff" x="0" y="0" height="100%" width="6"></rect>
        <rect fill="#ffffff" :x="lane_width * 4 + 6" y="0" height="100%" width="6"></rect>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.lane-wrapper {
  height: 100%;
  margin-right: 10px;
}

#lane-svg {
  bottom: 0;
  position: absolute;
  height: 100vh;
}
.not-playing > * > img[data-shown-note] {
  transition: bottom 0.1s cubic-bezier(0, 0, 0, 0.7);
}
</style>
