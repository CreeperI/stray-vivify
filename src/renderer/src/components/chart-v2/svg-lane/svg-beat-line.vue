<script lang="ts" setup>
import { computed } from 'vue'
import { Storage } from '@renderer/core/storage'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'
import { useUpdateFrameRate } from '@renderer/core/misc/frame-rates'

const chart_state = GlobalStat.chart_state
const chart = Chart.$current

const { view_port, bar_length } = GlobalStat.useSvgSizing()
const current_time = chart.audio.refs.current_ms
const mul = Storage.computes.mul
const bb_list = chart.diff.shown_bar_ticks

const __bar_length = computed(() => {
  return Storage.settings.sprites.bar_length
})
const __bar_op = computed(() => {
  return Storage.settings.sprites.bar_op / 100
})
const _show_beat_line = computed(() => {
  if (chart_state.value == 0) {
    return true
  } else if (chart_state.value == 1) {
    if (Storage.settings.record_field.show_beat_line) return true
  }
  return false
})
const offset1 = Storage.settings.offset1
function time_bottom_bar(t: number, time: number, _mul: number) {
  return view_port[3] - (time - t - offset1) * _mul - 80 - Storage.settings.sprites.bar_dy - (43/2)
}

function color_of_level(lvl: number): string {
  return Storage.settings.sprites['bar_color' + lvl] ?? '#ffffff'
}
useUpdateFrameRate('svg-beat-line')
</script>

<template>
  <g v-if="_show_beat_line" id="svg-beat-line" transform="translate(50 0)">
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
