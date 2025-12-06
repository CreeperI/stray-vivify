<script lang="ts" setup>
import NoteV2 from '@renderer/components/chart-v2/note-v2.vue'
import { inject, onMounted, onUnmounted } from 'vue'
import { ChartTypeV2 } from '@preload/types'
import { Storage } from '@renderer/core/storage'
import { Chart } from '@renderer/core/chart/chart'
import { useUpdateFrameRate } from '@renderer/core/misc/frame-rates'
import { GlobalStat } from '@renderer/core/globalStat'

useUpdateFrameRate('svg-notes-display')
const chart = Chart.$current

const shown = chart.diff.shown

const lane_width = inject<number>('lane_width') ?? Storage.settings.lane_width
function x_of(note: ChartTypeV2.note) {
  return note.lane * lane_width + 56 + 'px'
}
function fuck_wheel(e: WheelEvent) {
  if (GlobalStat.chart_state.value != 0) return
  if (e.ctrlKey || e.altKey) return
  chart.audio.pause()
  if (!e.target) return

  const current_time = chart.audio.current_time
  const meter = Storage.settings.meter
  const current_bpm = chart.diff.bpm_of_time(current_time)?.bpm ?? 120

  chart.audio.set_current_time(chart.diff.nearest(current_time))
  const scr = Math.round((4 / meter) * (60 / current_bpm) * Math.sign(e.deltaY) * 1000)
  if (Storage.settings.reverse_scroll) {
    chart.audio.set_current_time(chart.audio.current_time + scr)
  } else {
    chart.audio.set_current_time(chart.audio.current_time - scr)
  }
}
const top_id = inject('lane_id', '')
onMounted(() => {
  let id = setInterval(() => {
    const lw = document.getElementById(top_id)
    if (!lw) return
    lw.addEventListener('wheel', fuck_wheel)
    clearInterval(id)
  }, 500)

  chart.diff.fuck_shown(chart.audio.current_time, true)
})
onUnmounted(() => {
  document.getElementById(top_id)?.removeEventListener('wheel', fuck_wheel)
})
const d_height = inject<number>('d_height') ?? 0
</script>

<template>
  <g id="svg-notes">
    <foreignObject id="lane-notes" :y="-80 + d_height" height="100%" width="100%">
      <note-v2
        v-for="note in shown"
        :note="note"
        :style="{
          left: x_of(note)
        }"
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
.pt-selecting > img {
  pointer-events: none;
}
</style>
