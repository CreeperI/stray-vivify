<script lang="ts" setup>
import SvgLane from '@renderer/components/chart-v2/chart-tabs/svg-lane.vue'
import SvgNotesDisplay from '@renderer/components/chart-v2/svg-lane/svg-notes-display.vue'
import SvgModsEditor from '@renderer/components/chart-v2/svg-lane/svg-mods-editor.vue'
import { Storage } from '@renderer/core/storage'
import { computed } from 'vue'
import FnTime from '@renderer/components/chart-v2/chart-tabs/small/fn-time.vue'
import FnDebug from '@renderer/components/chart-v2/chart-tabs/small/fn-debug.vue'
import FnEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-editor.vue'
import FnVsmInfo from '@renderer/components/chart-v2/chart-tabs/small/fn-vsm-info.vue'
import FnModEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-mod-editor.vue'
import FnVsmMod from '@renderer/components/chart-v2/chart-tabs/small/fn-vsm-mod.vue'

const lane_width = Storage.settings.sv.lane_width
console.log(lane_width)
const opacity = computed(() => `opacity: ${Storage.settings.sv.opacity}%`)
const x_expand = Storage.settings.sv.expand_width
</script>

<template>
  <div class="chart-vsm">
    <div class="chart-fn fn-wrapper">
      <fn-vsm-info />
      <fn-vsm-mod />
      <fn-mod-editor />
    </div>
    <svg-lane :lane_width="lane_width" :x_expand="x_expand">
      <svg-notes-display :style="opacity" />

      <svg-mods-editor />
    </svg-lane>
    <div class="chart-fn fn-wrapper">
      <fn-editor />
      <fn-time />
      <fn-debug />
    </div>
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
