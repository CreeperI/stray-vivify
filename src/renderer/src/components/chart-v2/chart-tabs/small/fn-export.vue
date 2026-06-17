<script setup lang="ts">
import { Chart } from '@renderer/core/chart/chart'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'


function write_vsc() {
  const chart = Chart.current
  if (!chart) throw new Error('?????')
  chart.write_current_vsc()
}
function backup() {
  Chart.current?.backup()
}
</script>

<template>
  <div class="fn-export">
    <div style="grid-column: span 2">
      命名征集中
    </div>
    <a-button2 msg="导出vsc" @click="write_vsc" />
    <a-button2 msg="备份" @click="backup" />
  </div>
</template>

<style scoped>
.fn-export {
  display: grid;
  grid-template-columns: repeat(2, auto);
  justify-items: center;
}
</style>
