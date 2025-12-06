<script lang="ts" setup>
import { ChartTypeV2 } from '@preload/types'
import { Storage } from '@renderer/core/storage'
import { computed, inject } from 'vue'
import { utils } from '@renderer/core/utils'
import { Chart } from '@renderer/core/chart/chart'

const { note } = defineProps<{
  note: ChartTypeV2.note
}>()
const max_width = Chart.$current.diff.max_lane.value
const mul = Storage.computes.mul
const lane_width = inject<number>('lane_width') ?? Storage.settings.lane_width

const borderSrc = () => utils.borderSrc(note, max_width)
const getSrc = () => utils.getSrc(note, max_width)

function size() {
  return lane_width * note.width + 'px'
}

function urlOf() {
  return `${getSrc()}`
}

function left() {
  return `${note.lane * lane_width + 6}px`
}

function border() {
  // @ts-expect-error
  const width = note.len * mul.value
  const sliceHeight = 43 // 贴图实际高度（单位：px），按需替换为实际值
  return `border:none; border-top: transparent solid ${width}px;
    border-image-source: url("${borderSrc()}");
    border-image-slice: ${sliceHeight};
    border-image-repeat: stretch;
  `
}

function height() {
  return `${43 * (lane_width / 130)}px`
}

function zix() {
  if ('len' in note) return `z-index: ${5 - note.width}`
  else return `z-index: ${9 - note.width}`
}

function style() {
  if ('len' in note) {
    return `${zix()};height:${height()};width: ${size()}; left: ${left()}; ${border()};
    bottom:${time_bottom(note)}`
  } else {
    return `${zix()};width: ${size()}; left: ${left()};bottom:${time_bottom(note)}`
  }
}

function time_bottom(note: { time: number }) {
  return (
    (note.time - Chart.$current.audio.refs.current_ms.value - Storage.settings.offset1) * mul.value +
    'px'
  )
}

const _src = computed(urlOf)
const _style = computed(style)
</script>

<template>
  <img alt="" :src="_src" :style="_style" />
</template>

<style scoped>
img {
  width: min-content;
  user-select: none;
  display: block;
  position: absolute;
}
</style>
