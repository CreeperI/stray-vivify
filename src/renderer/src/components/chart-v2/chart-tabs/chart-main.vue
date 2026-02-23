<script lang="ts" setup>
import SvgLane from '@renderer/components/chart-v2/chart-tabs/svg-lane.vue'
import FnNote from '@renderer/components/chart-v2/chart-tabs/small/fn-note.vue'
import FnCounter from '@renderer/components/chart-v2/chart-tabs/small/fn-counter.vue'
import FnDensity from '@renderer/components/chart-v2/chart-tabs/small/fn-density.vue'
import FnEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-editor.vue'
import FnTime from '@renderer/components/chart-v2/chart-tabs/small/fn-time.vue'
import FnDebug from '@renderer/components/chart-v2/chart-tabs/small/fn-debug.vue'
</script>

<template>
  <div class="chart-main">
    <div class="chart-fn fn-wrapper">
      <fn-note />
      <fn-counter />
      <fn-density />
    </div>
    <svg-lane class="svg-lane" />
    <div class="chart-fn fn-wrapper">
      <fn-editor />
      <fn-time />
      <fn-debug />
    </div>
  </div>
  <div class="chart-main-left">
    <div class="chart-fn">
      <fn-note />
      <fn-editor />
      <fn-time />
      <fn-counter />
      <fn-density />
      <fn-debug />
    </div>
    <svg-lane class="svg-lane" />
  </div>
</template>

<style scoped>
.chart-main {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  flex-grow: 1;
  justify-content: space-around;
  position: relative;
}
.chart-main-left {
  display: none;
  flex-direction: row;
  width: 100%;
  height: 100%;
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

@media screen and (max-width: 1050px) {
  .chart-main {
    display: none;
  }
  .chart-main-left {
    display: flex;
  }
}
</style>
