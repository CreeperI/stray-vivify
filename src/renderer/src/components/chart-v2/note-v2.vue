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
  return str + '.png'
}

function size() {
  return lane_width * note.width + 'px'
}

function urlOf() {
  return `${getSrc()}`
}

function left() {
  return `${note.lane * lane_width + 6}px`
}

function borderTop() {
  // @ts-expect-error here the len isnt guaranteed in typing but its only called
  // when its a ln so dont fuck it.
  return `border-top: ${note.lane < 2 ? '#b3bdff' : '#feb3c7'} solid ${note.len * mul.value}px`
}

function height() {
  return `${43 * (lane_width / 130)}px`
}

function style() {
  if ('len' in note) {
    return `height:${height()};width: ${size()}; left: ${left()}; ${borderTop()};`
  } else {
    return `width: ${size()}; left: ${left()}`
  }
}
</script>

<template>
  <img alt="" :src="urlOf()" :style="style()"/>
</template>

<style scoped>
img {
  width: min-content;
  user-select: none;
  display: block;
  position: absolute;
}
</style>
