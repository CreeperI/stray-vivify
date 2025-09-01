<script setup lang="ts">
import { computed } from 'vue'
import { Settings } from '@renderer/core/settings'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'

const chart_state = GlobalStat.chart_state
const chart = Chart.$current
const lane_width = Settings.editor.lane_width
const svg_width = 4 * lane_width + 2 * 50 + 12
const bar_length = 4 * lane_width + 12
const current_time = chart.audio.refs.current_ms
const mul = Settings.computes.mul
const view_port = [0, 0, svg_width, window.screen.height]
const bb_list = chart.diff.shown_bar_beat

const __bar_color = computed(() => Settings.data.value.settings.sprites.bar_color)
const __bar_length = computed(() => Settings.data.value.settings.sprites.bar_length)
const __bar_op = computed(() => Settings.data.value.settings.sprites.bar_op / 100)
const _show_beat_line = computed(
  () =>
    chart_state.value == 0 ||
    (chart_state.value == 1 && Settings.editor.record_field.show_beat_line)
)
const offset1 = Settings.editor.offset1
const bar_offset = (((lane_width - 130) / 130) * 43) / 4
function time_bottom_bar(t: number, time: number, _mul: number) {
  return view_port[3] - (time - t - offset1) * _mul - 80 - bar_offset
}
</script>

<template>
  <g id="svg-beat-line" transform="translate(50 -20)" v-if="_show_beat_line">
    <line
      v-for="line in bb_list[1]"
      x1="0"
      :x2="bar_length"
      :y1="time_bottom_bar(current_time, line, mul)"
      :y2="time_bottom_bar(current_time, line, mul)"
      :stroke="__bar_color"
      :stroke-width="__bar_length"
      :opacity="__bar_op"
    ></line>
  </g>
</template>

<style scoped></style>
