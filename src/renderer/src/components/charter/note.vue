<script lang="ts" setup>
import { ChartType } from '@preload/types'
import { Charter } from '@renderer/core/charter'

const { note } = defineProps<{
  note: ChartType.note
}>()
const mul = Charter.refs.mul

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

function cover_add() {
  if (note.n == 'h') return 0
  if (['b', 'mb', 's'].includes(note.n)) return 1
  else return 2
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
  if (note.n != 'h')
    return `width: ${size()}; background-image: ${urlOf()};left: ${left()};z-index: calc(var(--z-highest) + ${cover_add()})`
  else
    return `width: ${size()}; background-image: ${urlOf()}; left: ${left()}; height: 43px; ${borderTop()};z-index: calc(var(--z-highest) + ${cover_add()})`
}
</script>

<template>
  <span :style="style()" />
</template>

<style scoped>
span {
  height: 43px;
  width: min-content;
  user-select: none;
  background-size: 100% 100%;
  transition: bottom 50ms linear;
}
</style>
