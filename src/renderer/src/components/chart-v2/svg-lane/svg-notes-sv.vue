<script lang="ts" setup>
import { ChartTypeV2 } from '@preload/types'
import { Storage } from '@renderer/core/storage'
import { Chart } from '@renderer/core/chart/chart'
import NoteV2Sv from '@renderer/components/chart-v2/note-v2-sv.vue'
import { GlobalStat } from '@renderer/core/globalStat'
import { inject, onMounted, onUnmounted } from 'vue'

const chart = Chart.$current
const diff = chart.diff

const lane_width = inject<number>('lane_width') ?? Storage.settings.lane_width

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
  const meter = Storage.settings.meter
  const current_bpm = chart.diff.bpm_of_time(current_time)?.bpm ?? 120

  const scr = Math.round((4 / meter) * (60 / current_bpm) * Math.sign(e.deltaY) * 1000)
  if (Storage.settings.reverse_scroll) {
    chart.audio.set_current_time(chart.diff.nearest(current_time) + scr)
  } else {
    chart.audio.set_current_time(chart.diff.nearest(current_time) - scr)
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

  chart.diff.sv_bind.on_sv.value = true
  chart.diff.fuck_shown(chart.audio.current_time, true)
})
onUnmounted(() => {
  chart.diff.sv_bind.on_sv.value = false
  document.getElementById(top_id)?.removeEventListener('wheel', fuck_wheel)
})
const d_height = inject<number>('d_height') ?? 0
</script>

<template>
  <g id="svg-notes">
    <foreignObject id="lane-notes" :y="-80 + d_height" height="100%" width="100%" x="50">
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
