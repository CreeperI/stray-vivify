<script lang="ts" setup>
import { Settings } from '@renderer/core/settings'
import { GlobalStat } from '@renderer/core/globalStat'
import { Charter } from '@renderer/core/charter'

const offset1 = Settings.editor.offset1

const sizing = GlobalStat.SvgSizing
const lane_width = sizing.lane_width
const view_port = sizing.view_port

const chart = Charter.get_chart()
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms

const bb_list = chart.diff.shown_t

const bar_offset = (((lane_width - 130) / 130) * 43) / 4
function time_bottom_bar(t: number, time: number, _mul: number) {
  return view_port[3] - (time - t - offset1) * _mul - 80 - bar_offset
}
</script>

<template>
  <g id="svg-section-list">
    <text
      v-for="[line, idx] in bb_list.section_list"
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
