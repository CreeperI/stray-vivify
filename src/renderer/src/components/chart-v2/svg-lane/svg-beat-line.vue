<script lang="ts" setup>
import { computed, inject, onMounted, useTemplateRef } from 'vue'
import { Storage } from '@renderer/core/storage'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'
import { useUpdateFrameRate } from '@renderer/core/misc/frame-rates'

const chart_state = GlobalStat.chart_state
const chart = Chart.$current

const __bar_length = computed(() => {
  return Storage.settings.sprites.bar_length
})
const __bar_op = computed(() => {
  return Storage.settings.sprites.bar_op / 100
})
const _show_beat_line = computed(() => {
  if (chart_state.value == 0) {
    return true
  } else if (chart_state.value == 1) {
    if (Storage.settings.record_field.show_beat_line) return true
  }
  return false
})
useUpdateFrameRate('svg-beat-line')
const g = useTemplateRef('svg-beat-line')
const diff = inject('diff', chart.diff)
onMounted(() => diff.element_groups.beat_line.mount(g.value))
</script>

<template>
  <g
    v-show="_show_beat_line"
    id="svg-beat-line"
    ref="svg-beat-line"
    :opacity="__bar_op"
    :stroke-width="__bar_length"
  />
</template>

<style scoped></style>
