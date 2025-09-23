<script setup lang="ts">
import { Settings } from '@renderer/core/settings'
import { Chart } from '@renderer/core/chart/chart'
import { computed } from 'vue'

const lane_width = Settings.editor.lane_width
const svg_width = 4 * lane_width + 2 * 50 + 12
const view_port = [0, 0, svg_width, window.screen.height]
const x = svg_width - 25
const offset1 = Settings.editor.offset1

const chart = Chart.$current
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms

// const bar_offset = (((lane_width - 130) / 130) * 43) / 4
const bar_offset = 0
const minus = view_port[3] - 80 - bar_offset - parseFloat(getComputedStyle(document.documentElement).fontSize);
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
      fill="gray"
      text-anchor="middle"
      :y="time_bottom_bar(current_time, tm, mul)"
    >
      .{{ tick }}
    </text>
  </g>
</template>

<style scoped></style>
