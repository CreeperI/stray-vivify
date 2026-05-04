<script lang="ts" setup>
import { computed, inject, onMounted, useTemplateRef } from 'vue'
import { Storage } from '@renderer/core/storage'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'
import { useUpdateFrameRate } from '@renderer/core/misc/frame-rates'

const chart_state = GlobalStat.chart_state

const chart = Chart.$current
const _show_bar_text = computed(
  () =>
    chart_state.value == 0 ||
    (chart_state.value == 1 && Storage.settings.record_field.show_bar_text)
)

useUpdateFrameRate('svg-bar-text')
const gR = useTemplateRef<SVGGElement>('bar-text')
const diff = inject("diff", chart.diff)
const textGroup = diff.element_groups.bar_text
onMounted(() => textGroup.mount(gR.value))
</script>

<template>
  <g v-show="_show_bar_text" id="svg-bar-text" ref="bar-text" />
</template>

<style scoped>
#svg-bar-text > text {
  user-select: none;
}
</style>
