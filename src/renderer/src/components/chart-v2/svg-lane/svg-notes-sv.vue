<script lang="ts" setup>
import { ChartTypeV2 } from '@preload/types'
import { Settings } from '@renderer/core/settings'
import { Chart } from '@renderer/core/chart/chart'
import NoteV2Sv from '@renderer/components/chart-v2/note-v2-sv.vue'
import { GlobalStat } from '@renderer/core/globalStat'
import { onMounted, onUnmounted } from 'vue'

const chart = Chart.$current
const diff = chart.diff
const lane_width = Settings.editor.lane_width

const shown = diff.shown

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

  const scr = Math.round((4 / meter) * (60 / current_bpm) * Math.sign(e.deltaY) * 1000)
  if (Settings.editor.reverse_scroll) {
    chart.audio.set_current_time(chart.diff.nearest(current_time) + scr)
  } else {
    chart.audio.set_current_time(chart.diff.nearest(current_time) - scr)
  }
}
onMounted(() => {
  let id = setInterval(() => {
    const lw = document.getElementById('lane-wrapper')
    if (!lw) return
    lw.addEventListener('wheel', fuck_wheel)
    clearInterval(id)
  }, 500)

  chart.diff.pooling.enabled = true
  chart.diff.fuck_shown(chart.audio.current_time, true)
})
onUnmounted(() => {
  chart.diff.pooling.enabled = false
  document.getElementById('lane-wrapper')?.removeEventListener('wheel', fuck_wheel)
})
</script>

<template>
  <g id="svg-notes">
    <foreignObject id="lane-notes" height="100%" width="100%" x="50" y="-80">
      <note-v2-sv
        v-for="note in shown"
        :note="note"
        :style="{
          left: x_of(note)
        }"
      />
    </foreignObject>
  </g>
</template>

<style scoped></style>
