<script lang="ts" setup>
import SvgLane from '@renderer/components/chart-v2/svg-lane/svg-lane.vue'
import FnNote from '@renderer/components/chart-v2/chart-tabs/small/fn-note.vue'
import FnCounter from '@renderer/components/chart-v2/chart-tabs/small/fn-counter.vue'
import FnDensity from '@renderer/components/chart-v2/chart-tabs/small/fn-density.vue'
import FnEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-editor.vue'
import FnTime from '@renderer/components/chart-v2/chart-tabs/small/fn-time.vue'
import FnDebug from '@renderer/components/chart-v2/chart-tabs/small/fn-debug.vue'
import SvgNotesEditor from '@renderer/components/chart-v2/svg-lane/svg-notes-editor.vue'
import { Chart } from '@renderer/core/chart/chart'
import { computed } from 'vue'
import { Storage } from '@renderer/core/storage'
import FnEditTools from '@renderer/components/chart-v2/chart-tabs/small/fn-edit-tools.vue'

const chart = Chart.$current
const d_ref = chart.refs.diff_ref
const display_other = computed(() => {
  return d_ref.value != -1 ? !Storage.settings.diff_reference.as_bg : false
})
const display_bg = computed(() => {
  return d_ref.value != -1 ? Storage.settings.diff_reference.as_bg : false
})
</script>

<template>
  <div class="chart-main">
    <div class="chart-fn fn-wrapper">
      <fn-note />
      <fn-counter />
      <fn-density />
    </div>
    <!--  when comparing in bg-mode  -->
    <template v-if="true" key="the-compare-fucks">
      <svg-lane v-if="display_bg" class="svg-lane">
        <svg-notes-editor />
        <svg-notes-editor
          :diff_index="d_ref"
          :disable_pending="true"
          :style="{ opacity: (Storage.settings.diff_reference.bg_op / 100).toFixed(2) }"
        />
      </svg-lane>

      <template v-else-if="display_other && Storage.settings.diff_reference.reverse">
        <svg-lane
          :key="d_ref"
          :diff_index="d_ref"
          :lane_width="Storage.settings.diff_reference.ref_lw"
          class="svg-lane"
          style="margin-left: 10px"
        >
          <svg-notes-editor :diff_index="d_ref" :disable_pending="true" />
        </svg-lane>
        <svg-lane :lane_width="Storage.settings.diff_reference.main_lw" class="svg-lane" />
      </template>
      <template v-else-if="display_other && !Storage.settings.diff_reference.reverse">
        <svg-lane :lane_width="Storage.settings.diff_reference.main_lw" class="svg-lane" />
        <svg-lane
          :key="d_ref"
          :diff_index="d_ref"
          :lane_width="Storage.settings.diff_reference.ref_lw"
          class="svg-lane"
          style="margin-left: 10px"
        >
          <svg-notes-editor :diff_index="d_ref" :disable_pending="true" />
        </svg-lane>
      </template>
      <svg-lane v-else class="svg-lane" />
    </template>
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
