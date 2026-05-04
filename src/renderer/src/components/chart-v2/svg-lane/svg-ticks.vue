<script lang="ts" setup>
import { Storage } from '@renderer/core/storage'
import { Chart } from '@renderer/core/chart/chart'
import { computed, inject, onMounted, useTemplateRef } from 'vue'
import { GlobalStat } from '@renderer/core/globalStat'

const chart = Chart.$current

const show_ticks = computed(() => {
  if (GlobalStat.chart_state.value == 0) return Storage.settings.show_ticks
  else if (GlobalStat.chart_state.value == 1) {
    return Storage.settings.record_field.show_circles
      ? false
      : Storage.settings.record_field.show_ticks
  } else return false
})
const g = useTemplateRef('svg-ticks')
const diff = inject('diff', chart.diff)
onMounted(() => diff.element_groups.tick.mount(g.value))
</script>

<template>
  <g v-show="show_ticks" id="svg-ticks" ref="svg-ticks" />
</template>

<style scoped></style>
