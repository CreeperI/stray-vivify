<script lang="ts" setup>
import FnNote from '@renderer/components/chart-v2/chart-tabs/small/fn-note.vue'
import FnCounter from '@renderer/components/chart-v2/chart-tabs/small/fn-counter.vue'
import FnDensity from '@renderer/components/chart-v2/chart-tabs/small/fn-density.vue'
import FnEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-editor.vue'
import FnTime from '@renderer/components/chart-v2/chart-tabs/small/fn-time.vue'
import FnDebug from '@renderer/components/chart-v2/chart-tabs/small/fn-debug.vue'
import FnEditTools from '@renderer/components/chart-v2/chart-tabs/small/fn-edit-tools.vue'
import PixiEditor from '@renderer/components/chart-v2/svg-lane/pixi-editor.vue'
</script>

<template>
  <div class="chart-main">
    <div class="chart-fn fn-wrapper">
      <fn-note />
      <fn-counter />
      <fn-density />
    </div>
    <!--  when comparing in bg-mode  -->
    <pixi-editor />
    <div class="chart-fn fn-wrapper">
      <fn-editor />
      <fn-time />
      <fn-edit-tools />
      <fn-debug />
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
