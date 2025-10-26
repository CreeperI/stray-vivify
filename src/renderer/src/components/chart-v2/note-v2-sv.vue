<script lang="ts" setup>
import { ChartTypeV2 } from '@preload/types'
import { Settings } from '@renderer/core/settings'
import { computed } from 'vue'
import { utils } from '@renderer/core/utils'
import { Chart } from '@renderer/core/chart/chart'

const { note } = defineProps<{
  note: ChartTypeV2.note
}>()

const chart = Chart.$current
const max_width = chart.diff.max_lane.value
const lane_width = Settings.editor.lane_width
const current_ms = chart.audio.refs.current_ms
const time_bottom = chart.diff.sv_bind.time_bottom

const borderSrc = () => utils.borderSrc(note, max_width)
const getSrc = () => utils.getSrc(note, max_width)

function size() {
  return lane_width * note.width + 'px'
}

function urlOf() {
  return getSrc()
}

function left() {
  return `${note.lane * lane_width + 6}px`
}

function height() {
  return `${43 * (lane_width / 130)}px`
}

function zix() {
  if ('len' in note) return `z-index: ${5 - note.width}`
  else return `z-index: ${9 - note.width}`
}

const _styleBase = computed(() => {
  if ('len' in note) {
    return `${zix()}; height: ${height()}; width: ${size()}; left: ${left()};`
  } else {
    return `${zix()}; width: ${size()}; left: ${left()};`
  }
})

function _time_bottom(note: { time: number }) {
  return (note.time - Chart.$current.audio.refs.current_ms.value - Settings.editor.offset1) * Settings.computes.mul.value
}
const _dynamicStyle = computed(() => {
  const currentTime = current_ms.value
  // const bottom = time_bottom.value(currentTime, note)
  const bottom = _time_bottom(note)

  if (!('len' in note)) {
    return `bottom: ${bottom}px;`
  }

  const endTime = note.time + note.len
  const bottomEnd = time_bottom.value(currentTime, { time: endTime })
  const borderWidth = bottomEnd - bottom

  const sliceHeight = 43
  return `
    bottom: ${bottom}px;
    border: none;
    border-top: transparent solid ${borderWidth}px;
    border-image-source: url("${borderSrc()}");
    border-image-slice: ${sliceHeight};
    border-image-repeat: stretch;
  `
})

const _src = computed(urlOf)
const _style = computed(() => _styleBase.value + _dynamicStyle.value)
</script>

<template>
  <img :data-time="note.time" :src="_src" :style="_style" alt="" />
</template>

<style scoped>
img {
  width: min-content;
  user-select: none;
  display: block;
  position: absolute;
}
</style>
