<script lang="ts" setup>
import SvgNotesSv from '@renderer/components/chart-v2/svg-lane/svg-notes-sv.vue'
import SvgLane from '@renderer/components/chart-v2/chart-tabs/svg-lane.vue'
import SvRight from '@renderer/components/chart-v2/chart-tabs/sv-right.vue'
import SvLeft from '@renderer/components/chart-v2/chart-tabs/sv-left.vue'
import { computed } from 'vue'
import SvgNotesDisplay from '@renderer/components/chart-v2/svg-lane/svg-notes-display.vue'
import { Storage } from '@renderer/core/storage'
import SvgSvLine from '@renderer/components/chart-v2/svg-lane/svg-sv-line.vue'

const lane_width = computed(() => Storage.settings.sv.lane_width)
const lane_width2 = computed(() => Storage.settings.sv.lane_width2)
</script>

<template>
  <div class="chart-main">
    <sv-left class="chart-fn" />
    <svg-lane :lane_width="lane_width" class="sv-left-lane">
      <svg-notes-display />
      <svg-sv-line />
    </svg-lane>
    <svg-lane :lane_width="lane_width2" :only_note="true" class="svg-lane">
      <svg-notes-sv />
    </svg-lane>
    <sv-right class="chart-fn" />
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
.sv-left-lane :deep(.no-event) {
  display: none;
}
</style>
