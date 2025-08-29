<script lang="ts" setup>
import { ChartTypeV2 } from '@preload/types'
import { Charter } from '@renderer/core/charter'
import { Settings } from '@renderer/core/Settings'

const { note } = defineProps<{
  note: ChartTypeV2.note
}>()
const mul = Charter.refs.mul
const lane_width = Settings.editor.lane_width

const note_style = 'stray:/__skin__'

function getSrc(): string {
  if (note.width == 0) return ''
  let str = note_style + '/' + note.width
  if ('snm' in note) {
    if (note.snm == 1) return str + 'b.png'
    if (note.snm == 2 && note.width != 1) str += 's'
  }
  if (note.width == 2) {
    str += note.lane == 0 ? 'l' : note.lane == 2 ? 'r' : 'm'
  } else if (note.width == 3) {
    str += note.lane == 0 ? 'l' : 'r'
  }
  if ('len' in note) str += 'h'
  return str + '.png'
}

function size() {
  return lane_width * note.width
}

function x_of() {
  return note.lane * lane_width + 56
}

function height() {
  return Math.floor((note['len'] ?? 0) * mul.value + 43 * (lane_width / 130))
}

</script>

<template>
  <image
    :href="getSrc()"
    :width="size()"
    :x="x_of()"
    :height="height()"
    preserveAspectRatio="none meet"
    :data-time="note.time"
  />
</template>

<style scoped>
img {
  width: min-content;
  user-select: none;
  display: block;
  position: absolute;
}
</style>
