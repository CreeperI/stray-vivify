<script lang="ts" setup>
import NoteV2 from '@renderer/components/chart-v2/note-v2.vue'
import { ChartTypeV2 } from '@preload/types'
import { Storage } from '@renderer/core/storage'
import { Chart } from '@renderer/core/chart/chart'
import { inject } from 'vue'

const chart = Chart.$current
const playfield = chart.$playfield
const lane_width = Storage.settings.lane_width

const shown = playfield.shown

function x_of(note: ChartTypeV2.note) {
  return note.lane * lane_width + 6 + 'px'
}
const refs = playfield.refs
const d_height = inject<number>('d_height') ?? 0
</script>

<template>
  <g id="svg-notes">
    <foreignObject id="lane-notes" :y="-80 + d_height" height="100%" width="100%" x="50">
      <note-v2
        v-for="note in shown"
        :note="note"
        :style="{
          left: x_of(note)
        }"
      />
    </foreignObject>
  </g>
  <g class="laser" transform="translate(56)">
    <transition-group name="laser">
      <rect
        v-if="refs.key_pressed[0]"
        :width="lane_width"
        :x="0"
        fill="#ccc"
        fill-opacity="0.1"
        height="100%"
        y="-80"
      />
      <rect
        v-if="refs.key_pressed[1]"
        :width="lane_width"
        :x="lane_width"
        fill="#ccc"
        fill-opacity="0.1"
        height="100%"
        y="-80"
      />
      <rect
        v-if="refs.key_pressed[2]"
        :width="lane_width"
        :x="lane_width * 2"
        fill="#ccc"
        fill-opacity="0.1"
        height="100%"
        y="-80"
      />
      <rect
        v-if="refs.key_pressed[3]"
        :width="lane_width"
        :x="lane_width * 3"
        fill="#ccc"
        fill-opacity="0.1"
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
