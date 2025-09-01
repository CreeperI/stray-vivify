<script lang="ts" setup>
import { computed } from 'vue'
import { Settings } from '@renderer/core/settings'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'

const chart_state = GlobalStat.chart_state
const chart = Chart.$current
const current_timing = chart.diff.current_timing

const _show_bottom_bpm = computed(
  () =>
    (chart_state.value == 0 && Settings.data.value.settings.show_bpm_bottom) ||
    (chart_state.value == 1 && Settings.data.value.settings.record_field.show_bpm_bottom)
)
</script>

<template>
  <g v-if="_show_bottom_bpm">
    <text dx="-1rem" dy="-35px" text-anchor="end" x="50%" y="100%">
      Timing #{{ current_timing }}
    </text>
    <text dy="-35px" text-anchor="start" x="50%" y="100%">
      {{ chart.diff.timing[current_timing].bpm }}bpm {{ chart.diff.timing[current_timing].num }}/{{
        chart.diff.timing[current_timing].den
      }}
    </text>
  </g>
</template>

<style scoped></style>
