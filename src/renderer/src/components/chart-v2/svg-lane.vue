<script setup lang="ts">
import { Settings } from '@renderer/core/Settings'
import { Charter } from '@renderer/core/charter'
import { ChartTypeV2 } from '@preload/types'
import NoteV2 from '@renderer/components/chart-v2/note-v2.vue'
import { ref, watch } from 'vue'

const lane_width = Settings.editor.lane_width
const svg_width = 4 * lane_width + 5 * 6 + 50
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
  return (note.t - t) * _mul + 'px'
}

function time_bottom_bar(t: number, time: number, _mul: number) {
  return view_port[3] - (time - t) * _mul - 80
}

function x_of(note: ChartTypeV2.note) {
  return note.l * (lane_width + 6) + 6 + 'px'
}

function fuck_wheel(e: WheelEvent) {
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

const pending = ref<ChartTypeV2.note>({ t: 0, l: 0, n: 'n' })
const pending_display = ref(false)

watch(pending_display, (v) => console.log(v))
watch(
  () => Settings.editor.note_type,
  () => update_pending_display('note')
)

function update_pending_display(_trigger: 'enter' | 'leave' | 'note') {
  if (Settings.editor.note_type == '') pending_display.value = false
  else if (_trigger == 'enter') pending_display.value = true
  else if (_trigger == 'leave') pending_display.value = false
}

function update_pending(e: MouseEvent) {
  if (Settings.editor.note_type == '') return
  const bottom = screen.availHeight - 80 - e.offsetY
  const mouse_time = bottom / mul.value + current_time.value
  let lane: number
  // const lane = Math.floor((e.offsetX / svg_width) * 4)
  // console.log(lane)
  switch (Settings.editor.note_type) {
    case 'mb':
    case 'b':
    case 's':
      if (Settings.editor.middle) {
        lane = Math.min(Math.floor((e.offsetX / svg_width) * 4), 2)
      } else {
        lane = Math.floor((e.offsetX / svg_width) * 2) * 2
      }
      break
    case 'f':
      lane = 0
      break
    default:
      lane = Math.floor((e.offsetX / svg_width) * 4)
  }
  pending.value = {
    t: chart.diff.nearest(mouse_time),
    l: lane,
    n: Settings.editor.note_type
  }
}

function on_click() {
  if (Settings.editor.note_type == '') return
  if (Settings.editor.note_type == 'h') {
    // wait to implement
  }
  chart.diff.add_note(pending.value)
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
        <rect fill="#303b7c66" :x="lane_width + 6" y="0" height="100%" width="6"></rect>
        <rect fill="#303b7c66" :x="lane_width * 2 + 12" y="0" height="100%" width="6"></rect>
        <rect fill="#303b7c66" :x="lane_width * 3 + 18" y="0" height="100%" width="6"></rect>
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
        <g id="svg-notes">
          <foreignObject
            height="100%"
            width="100%"
            x="0"
            y="-80"
            @click="on_click"
            @mousemove="update_pending"
          >
            <note-v2
              :note="pending"
              :style="{
                bottom: time_bottom(current_time, pending, mul),
                left: x_of(pending)
              }"
              style="opacity: 0.5; pointer-events: none"
              v-if="pending_display"
            />
            <note-v2
              :note="note"
              v-for="note in shown"
              :key="note.t + note.l"
              :style="{
                bottom: time_bottom(current_time, note, mul),
                left: x_of(note)
              }"
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
        <rect fill="#ffffff" :x="lane_width * 4 + 24" y="0" height="100%" width="6"></rect>
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
</style>
