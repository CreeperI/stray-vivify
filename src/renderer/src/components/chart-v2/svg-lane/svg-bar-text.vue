<script setup lang="ts">
import { computed } from 'vue'
import { Settings } from '@renderer/core/settings'
import { GlobalStat } from '@renderer/core/globalStat'
import { Charter } from '@renderer/core/charter'

const chart_state = GlobalStat.chart_state
const lane_width = Settings.editor.lane_width
const svg_width = 4 * lane_width + 2 * 50 + 12
const view_port = [0, 0, svg_width, window.screen.height]
const offset1 = Settings.editor.offset1

const chart = Charter.get_chart()
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms


const _show_bar_text = computed(
  () =>
    chart_state.value == 0 || (chart_state.value == 1 && Settings.editor.record_field.show_bar_text)
)
const bb_list = chart.diff.shown_bar_beat


const bar_offset = (((lane_width - 130) / 130) * 43) / 4
function time_bottom_bar(t: number, time: number, _mul: number) {
  return view_port[3] - (time - t - offset1) * _mul - 80 - bar_offset
}

</script>

<template>
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
</template>

<style scoped></style>
