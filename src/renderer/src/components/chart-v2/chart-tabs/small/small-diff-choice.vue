<script setup lang="ts">
import ASelect from '@renderer/components/a-elements/a-select.vue'
import { Chart } from '@renderer/core/chart/chart'
import { utils } from '@renderer/core/utils'

const chart = Chart.$current
const options = () =>
  chart.diffs.map((x, v: number) => {
    if (x.meta.diff2 == '') return { val: v, display: x.meta.diff1 }
    return { val: v, display: x.meta.diff1 + ' - ' + x.meta.diff2 }
  })
const dix = chart.ref.diff_index
const rkey = utils.refresh_key
</script>

<template>
  <div class="left-diff-choice">
    <div>选择难度：</div>
    <a-select :key="rkey" v-model="dix" :options="options()" />
  </div>
</template>

<style scoped>
.left-diff-choice {
  display: flex;
  flex-direction: row;
  gap: 10px 0;
  justify-content: space-evenly;
  width: 100%;
  white-space: nowrap;
}
:deep(.a-select-value) {
  overflow-x: hidden;
}
</style>
