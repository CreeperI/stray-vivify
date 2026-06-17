<script lang="ts" setup>
import FnNote from '@renderer/components/chart-v2/chart-tabs/small/fn-note.vue'
import FnCounter from '@renderer/components/chart-v2/chart-tabs/small/fn-counter.vue'
import FnDensity from '@renderer/components/chart-v2/chart-tabs/small/fn-density.vue'
import FnEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-editor.vue'
import FnTime from '@renderer/components/chart-v2/chart-tabs/small/fn-time.vue'
import FnEditTools from '@renderer/components/chart-v2/chart-tabs/small/fn-edit-tools.vue'
import PixiEditor from '@renderer/components/chart-v2/svg-lane/pixi-editor.vue'
import { Chart } from '@renderer/core/chart/chart'
import DiffRef from '@renderer/components/chart-v2/svg-lane/diff-ref.vue'

const chart = Chart.$current
const d_ref = chart.refs.diff_ref
</script>

<template>
  <div class="chart-main">
    <div class="chart-fn fn-wrapper">
      <fn-note />
      <fn-counter />
      <fn-density />
    </div>
    <!--  when comparing in bg-mode  -->
    <diff-ref v-if="d_ref != -1" />
    <pixi-editor v-else />
    <div class="chart-fn fn-wrapper">
      <fn-editor />
      <fn-time />
      <fn-edit-tools />
    </div>
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
  contain: strict;
  gap: 5px;
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
</style>
