<script setup lang="ts">
import { Settings } from '@renderer/core/Settings'
import { Charter } from '@renderer/core/charter'
import { ChartTypeV2 } from '@preload/types'
import NoteV2 from '@renderer/components/chart-v2/note-v2.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { GlobalStat } from '@renderer/core/globalStat'

const chart_state = GlobalStat.chart_state
const lane_width = Settings.editor.lane_width
const svg_width = 4 * lane_width + 2 * 50 + 12
const bar_length = 4 * lane_width + 12
const view_port = [0, 0, svg_width, window.screen.height]
const _px = svg_width + 'px'
const offset1 = Settings.editor.offset1

const chart = Charter.get_chart()
const shown = chart.diff.shown
const update_shown_flag = chart.diff.update_shown_flag
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms
const bb_list = chart.diff.shown_bar_beat
const timing_list = chart.diff.shown_timing
const current_timing = chart.diff.current_timing

function time_bottom(t: number, note: ChartTypeV2.note, _mul: number) {
  // if (note.n == 'h')
  //   return (note.t + note.h / 2 - t) * _mul + 'px'
  // else
  return (note.time - t - offset1) * _mul + 'px'
}

const bar_offset = (((lane_width - 130) / 130) * 43) / 4
function time_bottom_bar(t: number, time: number, _mul: number) {
  return view_port[3] - (time - t - offset1) * _mul - 80 - bar_offset
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

watch(
  update_shown_flag,
  (v) => {
    if (v) force_playing.value = v
  },
  { flush: 'sync' }
)
watch(
  update_shown_flag,
  (v) => {
    if (!v) {
      requestAnimationFrame(() => (force_playing.value = v))
    }
  },
  { flush: 'post' }
)
// ------------ pending --------------
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

watch(chart.audio.refs.paused, (v) => {
  if (!v) {
    pending_display.value = false
    pending_hold_fixed = false
  }
})

function update_pending_display(_trigger: 'enter' | 'leave' | 'note') {
  if (GlobalStat.chart_state.value != 0) return
  if (Settings.note.w == 0) pending_display.value = false
  else if (_trigger == 'enter') pending_display.value = true
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

const _show_left_bpm = computed(
  () =>
    chart_state.value == 0 || (chart_state.value == 1 && Settings.editor.record_field.show_bpm_left)
)
const _show_bottom_bpm = computed(
  () =>
    (chart_state.value == 0 && Settings.data.value.settings.show_bpm_bottom) ||
    (chart_state.value == 1 && Settings.data.value.settings.record_field.show_bpm_bottom)
)
const _show_bar_text = computed(
  () =>
    chart_state.value == 0 || (chart_state.value == 1 && Settings.editor.record_field.show_bar_text)
)
const _show_beat_line = computed(
  () =>
    chart_state.value == 0 ||
    (chart_state.value == 1 && Settings.editor.record_field.show_beat_line)
)

onMounted(() => {
  console.log(
    'svg-lane mounted',
    `lane-width ${lane_width}px, bar-length ${bar_length}px`,
    Charter.constants.screenH - 73
  )
})
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
    >
      <rect x="0" y="0" width="100%" height="100%" fill="#000000"></rect>
      <g v-if="_show_bar_text">
        <text
          v-for="[line, idx] in bb_list[0]"
          x="25"
          fill="#ffffff"
          dy="-1rem"
          font-size="1.2rem"
          opacity="0.5"
          :y="time_bottom_bar(current_time, line, mul)"
          text-anchor="middle"
          style="user-select: none"
        >
          {{ idx + 1 }}
        </text>
      </g>
      <g v-if="_show_left_bpm">
        <text
          v-for="tm in timing_list"
          x="25"
          fill="#b8dcee"
          font-size="1.2rem"
          text-anchor="middle"
          :y="time_bottom_bar(current_time, tm.time, mul)"
        >
          {{ tm.bpm }}
        </text>
      </g>
      <g>
        <rect fill="#131520" x="50" y="0" height="100%" :width="bar_length"></rect>
        <g id="svg-beat-line" transform="translate(50 -20)" v-if="_show_beat_line">
          <line
            v-for="line in bb_list[1]"
            x1="0"
            :x2="bar_length"
            :y1="time_bottom_bar(current_time, line, mul)"
            :y2="time_bottom_bar(current_time, line, mul)"
            stroke="#ffffff"
            stroke-width="3"
          ></line>
        </g>
        <g id="svg-notes" :class="not_playing_class">
          <foreignObject
            height="100%"
            width="100%"
            x="50"
            y="-80"
            @click="on_click"
            @mousemove.capture="update_pending"
            id="lane-notes"
          >
            <note-v2
              :note="pending_note"
              :style="{
                bottom: time_bottom(current_time, pending_note, mul),
                left: x_of(pending_note)
              }"
              style="opacity: 0.7; pointer-events: none; z-index: 10"
              v-if="pending_display"
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
        <g id="svg-particle" transform="translate(50)"></g>
        <rect
          fill="#888"
          x="53"
          :y="Charter.constants.screenH - 77"
          height="80"
          :width="bar_length - 6"
          stroke="#ffffff"
          stroke-width="6"
          id="svg-bottom-rect"
        />
        <g v-if="_show_bottom_bpm">
          <text x="50%" y="1050" text-anchor="end" dx="-1rem">Timing #{{ current_timing }}</text>
          <text x="50%" y="1050" text-anchor="start">
            {{ chart.diff.timing[current_timing].bpm }}bpm
            {{ chart.diff.timing[current_timing].num }}/{{ chart.diff.timing[current_timing].den }}
          </text>
        </g>
        <g transform="translate(50 0)">
          <rect fill="#ffffff" x="0" y="0" height="100%" width="6"></rect>
          <rect fill="#ffffff" :x="lane_width * 4 + 6" y="0" height="100%" width="6"></rect>
        </g>
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
  height: 1080px;
}

.not-playing > * > img[data-shown-note] {
  transition: bottom 0.1s cubic-bezier(0, 0, 0, 0.7);
}
text {
  user-select: none;
}
</style>
