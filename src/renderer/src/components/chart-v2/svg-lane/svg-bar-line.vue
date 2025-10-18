<script setup lang="ts">
import { GlobalStat } from '@renderer/core/globalStat'
import { Settings } from '@renderer/core/settings'
import { computed } from 'vue'
import { Chart } from '@renderer/core/chart/chart'
import { useUpdateFrameRate } from '@renderer/core/frame-rates'

const chart_state = GlobalStat.chart_state

const view_port = GlobalStat.SvgSizing.view_port
const offset1 = Settings.editor.offset1

const chart = Chart.$current
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms

// const bar_offset = (((lane_width - 130) / 130) * 43) / 4
const bar_offset = 0
const _show_left_bpm = computed(
  () =>
    chart_state.value == 0 || (chart_state.value == 1 && Settings.editor.record_field.show_bpm_left)
)
function time_bottom_bar(t: number, time: number, _mul: number) {
  return view_port[3] - (time - t - offset1) * _mul - 80 - bar_offset
}
const timing_list = chart.diff.shown_timing

useUpdateFrameRate("svg-bar-line")
</script>

<template>
  <g v-if="_show_left_bpm" id="svg-bar-line">
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
</template>

<style scoped>
text {
  user-select: none;
}
</style>
