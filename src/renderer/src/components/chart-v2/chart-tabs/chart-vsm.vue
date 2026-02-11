<script lang="ts" setup>
import VsmLeft from '@renderer/components/chart-v2/chart-tabs/vsm-left.vue'
import SvgLane from '@renderer/components/chart-v2/chart-tabs/svg-lane.vue'
import SvgNotesDisplay from '@renderer/components/chart-v2/svg-lane/svg-notes-display.vue'
import LaneRight from '@renderer/components/chart-v2/chart-tabs/lane-right.vue'
import SvgModsEditor from '@renderer/components/chart-v2/svg-lane/svg-mods-editor.vue'
import { Storage } from '@renderer/core/storage'
import { computed } from 'vue'

const lane_width = Storage.settings.sv.lane_width
console.log(lane_width)
const opacity = computed(() => `opacity: ${Storage.settings.sv.opacity}%`)
const x_expand = Storage.settings.sv.expand_width
</script>

<template>
  <div class="chart-vsm">
    <vsm-left />
    <svg-lane :lane_width="lane_width" :x_expand="x_expand">
      <svg-notes-display :style="opacity" />

        <svg-mods-editor />

    </svg-lane>
    <lane-right />
  </div>
</template>

<style scoped>
.chart-vsm {
  display: flex;
  flex-direction: row;
  width: 100%;
  flex-grow: 1;
  justify-content: space-around;
  position: relative;
}
</style>
