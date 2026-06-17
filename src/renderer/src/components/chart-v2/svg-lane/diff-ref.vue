<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { computed } from 'vue'
import { Storage } from '@renderer/core/storage'
import PixiEditor from '@renderer/components/chart-v2/svg-lane/pixi-editor.vue'
import PixiLane from '@renderer/components/chart-v2/svg-lane/pixi-lane.vue'

const chart = Chart.$current
const d_ref = chart.refs.diff_ref
const display_other = computed(() => {
  return d_ref.value != -1
})
const ref_lw = computed(() => Storage.settings.diff_reference.ref_lw)
const main_lw = computed(() => Storage.settings.diff_reference.main_lw)
</script>

<template>
    <template v-if="display_other && Storage.settings.diff_reference.reverse">
      <pixi-lane :key="d_ref" :diff_index="d_ref" :lane_width="ref_lw" />
      <pixi-editor :lane_width="main_lw" />
    </template>
    <template v-else-if="display_other">
      <pixi-editor :lane_width="main_lw" />
      <pixi-lane :key="d_ref" :diff_index="d_ref" :lane_width="ref_lw" />
    </template>

</template>

<style scoped>

</style>
