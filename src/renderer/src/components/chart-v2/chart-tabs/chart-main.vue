<script setup lang="ts">
import SvgLane from '@renderer/components/chart-v2/chart-tabs/svg-lane.vue'
import LaneLeft from '@renderer/components/chart-v2/chart-tabs/lane-left.vue'
import LaneRight from '@renderer/components/chart-v2/chart-tabs/lane-right.vue'
</script>

<template>
  <div class="chart-main">
    <lane-left class="chart-fn" />
    <svg-lane class="svg-lane" />
    <lane-right class="chart-fn" />
  </div>
</template>

<style scoped>
.chart-main {
  display: flex;
  flex-direction: row;
  width: 100%;
  flex-grow: 1;
  justify-content: space-around;
  position: relative;
}

.svg-lane {
  z-index: 2;
}

.chart-fn {
  z-index: 1;
}

@media screen and (max-width: 650px) {
  .chart-fn {
    display: none;
  }
}
</style>
