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
  if (note.n == 'n' || note.n == 'h') {
    return note.l < 2 ? '/noteL.png' : '/noteR.png'
  } else if (note.n == 'b') {
    if (note.l == 0) return '/bL.png'
    if (note.l == 1) return '/bM.png'
    else return '/bR.png'
  } else if (note.n == 'm') return '/bomb.png'
  else if (note.n == 'mb') return '/bB.png'
  else if (note.n == 's') {
    if (note.l == 0) return '/sbL.png'
    if (note.l == 1) return '/sbM.png'
    else return '/sbR.png'
  } else if (note.n == 'f') return '/f.png'
    // it would only be triggered when "p" comes but its only fucking mind to happen
    throw new Error(JSON.stringify(note))
}

function cover_add() {
  if (note.n == 'h') return 0
  if (['b', 'mb', 's'].includes(note.n)) return 1
  else return 2
}

function size() {
  if (['b', 'mb', 's'].includes(note.n)) return lane_width * 2 + 6 + 'px'
  if (note.n == 'f') return lane_width * 4 + 18 + 'px'
  return lane_width + 'px'
}

function urlOf() {
  return `${note_style + getSrc()}`
}

function left() {
  return `${note.l * 137 + 6}px`
}

function borderTop() {
  if (note.n != 'h') return ''
  return `border-top: ${note.l < 2 ? '#b3bdff' : '#feb3c7'} solid ${note.h * mul.value}px;`
}

function height() {
  return `${43 * (Settings.editor.lane_width / 132)}px`
}

function style() {
  if (note.n != 'h')
    return `height:${height()};width: ${size()};left: ${left()};z-index: calc(var(--z-highest) + ${cover_add()})`
  else
    return `height:${height()};width: ${size()};left: ${left()}; height: 43px; ${borderTop()};z-index: calc(var(--z-highest) + ${cover_add()})`
}
</script>

<template>
  <img alt="" :src="urlOf()" :style="style()" />
</template>

<style scoped>
img {
  width: min-content;
  user-select: none;
  background-size: 100% 100%;
  display: block;
  position: absolute;
}
</style>
