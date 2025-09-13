<script setup lang="ts">
import NoteV2 from '@renderer/components/chart-v2/note-v2.vue'
import { Charter } from '@renderer/core/charter'
import { Settings } from '@renderer/core/settings'
import { ChartTypeV2 } from '@preload/types'

const chart = Charter.get_chart()
const lane_width = Settings.editor.lane_width

const shown = chart.diff.shown
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms
const offset = Settings.settings.value.settings.offset1

function time_bottom(t: number, note: ChartTypeV2.note, _mul: number) {
  // if (note.n == 'h')
  //   return (note.t + note.h / 2 - t) * _mul + 'px'
  // else
  return chart.diff.sv_time_bottom(note, _mul) - offset + 'px'
}

function x_of(note: ChartTypeV2.note) {
  return note.lane * lane_width + 6 + 'px'
}
</script>

<template>
  <g id="svg-notes">
    <foreignObject id="lane-notes" height="100%" width="100%" x="50" y="-80">
      <note-v2
        v-for="note in shown"
        :note="note"
        :style="{
          bottom: time_bottom(current_time, note, mul),
          left: x_of(note)
        }"
      />
    </foreignObject>
  </g>
</template>

<style scoped></style>
