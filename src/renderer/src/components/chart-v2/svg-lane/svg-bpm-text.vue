<script lang="ts" setup>
import { GlobalStat } from '@renderer/core/globalStat'
import { Storage } from '@renderer/core/storage'
import { computed, inject, onMounted, useTemplateRef } from 'vue'
import { Chart } from '@renderer/core/chart/chart'
import { useUpdateFrameRate } from '@renderer/core/misc/frame-rates'

const chart_state = GlobalStat.chart_state

const chart = Chart.$current
// const bar_offset = (((lane_width - 130) / 130) * 43) / 4
const _show_left_bpm = computed(
  () =>
    chart_state.value == 0 ||
    (chart_state.value == 1 && Storage.settings.record_field.show_bpm_left)
)
useUpdateFrameRate('svg-bar-line')
const g = useTemplateRef('svg-bar-line')
const diff = inject('diff', chart.diff)
onMounted(() => diff.element_groups.bpm_text.mount(g.value))
</script>

<template>
  <g v-show="_show_left_bpm" ref="svg-bar-line" id="svg-bar-line" />
</template>

<style scoped>
text {
  user-select: none;
}
</style>
