<script lang="ts" setup>
import { computed } from 'vue'
import { Storage } from '@renderer/core/storage'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'
import { useUpdateFrameRate } from '@renderer/core/misc/frame-rates'

const chart_state = GlobalStat.chart_state
const offset1 = Storage.settings.offset1

const { view_port } = GlobalStat.useSvgSizing()

const chart = Chart.$current
const mul = Storage.computes.mul
const current_time = chart.audio.refs.current_ms

const _show_bar_text = computed(
  () =>
    chart_state.value == 0 || (chart_state.value == 1 && Storage.settings.record_field.show_bar_text)
)

function time_bottom_bar(t: number, time: number, _mul: number) {
  return view_port[3] - (time - t - offset1) * _mul - 80
}
const bb_list = computed(() => chart.diff.shown_t.value)
useUpdateFrameRate('svg-bar-text')
</script>

<template>
  <g v-if="_show_bar_text" id="svg-bar-text">
    <text
      v-for="[line, idx] in bb_list.bar_list"
      :y="time_bottom_bar(current_time, line, mul)"
      dy="-1rem"
      fill="#ffffff"
      font-size="1.2rem"
      opacity="0.5"
      style="user-select: none"
      text-anchor="middle"
      x="25"
    >
      {{ idx + 1 }}
    </text>
  </g>
</template>

<style scoped></style>
