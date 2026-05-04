<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { inject, onMounted, useTemplateRef } from 'vue'

const chart = Chart.$current

const g = useTemplateRef('svg-section-list')
const diff = inject('diff', chart.diff)
onMounted(() => diff.element_groups.section.mount(g.value))
</script>

<template>
  <g id="svg-bar-text" ref="svg-section-list" />
</template>

<style scoped>
#svg-section-list > text {
  user-select: none;
  pointer-events: none;
}
</style>
