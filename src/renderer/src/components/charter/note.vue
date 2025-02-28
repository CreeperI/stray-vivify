<script lang="ts" setup>
import { ChartType } from '@preload/types'
import ui from '@renderer/core/ui'

const { note } = defineProps<{
  note: ChartType.note
}>()
const mul = ui.mul

const note_style = '.'

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
  }
  return ''
}
function size() {
  if (['b', 'mb', 's'].includes(note.n)) return '271px'
  return '132px'
}
function urlOf() {
  return `url("${note_style + getSrc()}")`
}
function left() {
  return `${note.l * 137 + 6}px`
}
function borderTop() {
  if (note.n != 'h') return ''
  return `border-top: ${note.l < 2 ? '#b3bdff' : '#feb3c7'} solid ${note.h * mul.value}px;`
}

function style() {
  if (note.n != 'h') return `width: ${size()}; background-image: ${urlOf()};left: ${left()};`
  else
    return `width: ${size()}; background-image: ${urlOf()}; left: ${left()}; height: 43px; ${borderTop()}`
}
</script>

<template>
  <span :style="style()" />
</template>

<style scoped>
span {
  height: 43px;
  width: min-content;
  z-index: var(--z-highest);
  user-select: none;
  background-size: 100% 100%;
}
</style>
