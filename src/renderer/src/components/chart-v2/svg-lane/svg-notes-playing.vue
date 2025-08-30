<script lang="ts" setup>
import NoteV2 from '@renderer/components/chart-v2/note-v2.vue'
import { Charter } from '@renderer/core/charter'
import { ChartTypeV2 } from '@preload/types'
import { Settings } from '@renderer/core/Settings'

const chart = Charter.get_chart()
const playfield = chart.$playfield
const lane_width = Settings.editor.lane_width

const shown = playfield.shown
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms
const offset = Settings.settings.value.settings.offset3

function time_bottom(t: number, note: ChartTypeV2.note, _mul: number) {
  // if (note.n == 'h')
  //   return (note.t + note.h / 2 - t) * _mul + 'px'
  // else
  return (note.time - t - offset) * _mul + 'px'
}

function x_of(note: ChartTypeV2.note) {
  return note.lane * lane_width + 6 + 'px'
}
const refs = playfield.refs
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
  <g class="laser" transform="translate(56)">
    <transition-group name="laser">
      <rect
        fill-opacity="0.1"
        v-if="refs.key_pressed[0]"
        :width="lane_width"
        :x="0"
        fill="#ccc"
        height="100%"
        y="-80"
      />
      <rect
        fill-opacity="0.1"
        v-if="refs.key_pressed[1]"
        :width="lane_width"
        :x="lane_width"
        fill="#ccc"
        height="100%"
        y="-80"
      />
      <rect
        fill-opacity="0.1"
        v-if="refs.key_pressed[2]"
        :width="lane_width"
        :x="lane_width * 2"
        fill="#ccc"
        height="100%"
        y="-80"
      />
      <rect
        fill-opacity="0.1"
        v-if="refs.key_pressed[3]"
        :width="lane_width"
        :x="lane_width * 3"
        fill="#ccc"
        height="100%"
        y="-80"
      />
    </transition-group>
  </g>
</template>

<style scoped>
.laser-enter-active,
.laser-leave-active {
  transition: all 0.05s ease;
}
.laser-enter-from,
.laser-leave-to {
  fill-opacity: 0;
}
.laser-enter-to,
.laser-leave-from {
  fill-opacity: 0.1;
}
</style>
