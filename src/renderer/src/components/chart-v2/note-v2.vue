<script lang="ts" setup>
import { ChartTypeV2 } from '@preload/types'
import { Storage } from '@renderer/core/storage'
import { computed, inject } from 'vue'
import { utils } from '@renderer/core/utils'
import { Chart } from '@renderer/core/chart/chart'
import { FrameRate } from '@renderer/core/misc/frame-rates'

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
  const sliceHeight = 43
  // @ts-expect-error
  const width = note.len * mul.value - 0.5 * sliceHeight
  return `border:none; border-top: transparent solid ${width}px;
    border-image-source: url(${borderSrc()});
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
  FrameRate.note_style.immediate()
  if ('len' in note) {
    return `${zix()};height:${height()};width: ${size()}; left: ${left()}; ${border()};`
  } else {
    return `${zix()};width: ${size()}; left: ${left()};`
  }
}

function time_bottom(note: { time: number }, t: number) {
  FrameRate.note_bottom.immediate()
  return `bottom: ${(note.time - t - Storage.settings.offset1) * mul.value}px`
}

const _src = computed(urlOf)
const _style = computed(style)
const current_time = Chart.$current.audio.refs.current_ms
</script>

<template>
  <img :src="_src" :style="[_style, time_bottom(note, current_time)]" alt="" />
</template>

<style scoped>
img {
  width: min-content;
  user-select: none;
  display: block;
  position: absolute;
}
</style>
