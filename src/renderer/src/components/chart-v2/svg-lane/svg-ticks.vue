<script lang="ts" setup>
import { Settings } from '@renderer/core/settings'
import { Chart } from '@renderer/core/chart/chart'
import { computed } from 'vue'
import { GlobalStat } from '@renderer/core/globalStat'

const offset1 = Settings.editor.offset1

const sizing = GlobalStat.SvgSizing
const view_port = sizing.view_port
const x = sizing.svg_width - 25

const chart = Chart.$current
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms

// const bar_offset = (((lane_width - 130) / 130) * 43) / 4
const bar_offset = 0
const minus =
  view_port[3] - 80 - bar_offset - parseFloat(getComputedStyle(document.documentElement).fontSize)
const show_ticks = computed(() => Settings.editor.show_ticks)
function time_bottom_bar(t: number, time: number, _mul: number) {
  return minus - (time - t - offset1) * _mul
}
const shown_t = chart.diff.shown_t
</script>

<template>
  <g v-if="show_ticks">
    <text
      v-for="[tm, tick] in shown_t.ticks"
      :x="x"
      :y="time_bottom_bar(current_time, tm, mul)"
      fill="gray"
      text-anchor="middle"
    >
      .{{ tick }}
    </text>
  </g>
</template>

<style scoped></style>
