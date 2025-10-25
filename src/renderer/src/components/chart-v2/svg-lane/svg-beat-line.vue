<script lang="ts" setup>
import { computed } from 'vue'
import { Settings } from '@renderer/core/settings'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'
import { useUpdateFrameRate } from '@renderer/core/frame-rates'

const chart_state = GlobalStat.chart_state
const chart = Chart.$current

const sizing = GlobalStat.SvgSizing
const lane_width = sizing.lane_width
const bar_length = sizing.bar_length
const current_time = chart.audio.refs.current_ms
const mul = Settings.computes.mul
const view_port = sizing.view_port
const bb_list = chart.diff.shown_t

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
  return view_port[3] - (time - t - offset1) * _mul - 80 - bar_offset - Settings.editor.sprites.bar_dy
}

function color_of_level(lvl: number): string {
  return Settings.editor.sprites['bar_color' + lvl] ?? '#ffffff'
}
useUpdateFrameRate('svg-beat-line')
</script>

<template>
  <g v-if="_show_beat_line" id="svg-beat-line" transform="translate(50 -20)">
    <line
      v-for="[line, lvl] in bb_list.beat_list"
      :data-lvl="lvl"
      :opacity="__bar_op"
      :stroke="color_of_level(lvl)"
      :stroke-width="__bar_length"
      :x2="bar_length"
      :y1="time_bottom_bar(current_time, line, mul)"
      :y2="time_bottom_bar(current_time, line, mul)"
      x1="0"
    ></line>
  </g>
</template>

<style scoped></style>
