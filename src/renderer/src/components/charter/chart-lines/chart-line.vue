<script lang="ts" setup>
import { computed } from 'vue'
import { Charter } from '@renderer/core/charter'
import ChartLineLeft from '@renderer/components/charter/chart-lines/chart-line-left.vue'
import ChartLineMiddle from '@renderer/components/charter/chart-lines/chart-line-middle.vue'
import ChartLineRecord from '@renderer/components/charter/chart-lines/chart-line-record.vue'

const { charter_layout } = Charter.settings.to_refs
const update = Charter.refresh.flag
const record = Charter.record.mode

const w = Charter.refs.window.width
const should_left = computed(() => {
  if (charter_layout.value == 'auto') {
    return w.value <= 1600
  }
  return charter_layout.value == 'left'
})
</script>

<template>
  <div v-if="update" class="charter-wrapper">
    <ChartLineRecord v-if="record"/>
    <ChartLineLeft v-else-if="should_left" />
    <ChartLineMiddle v-else />
  </div>
</template>

<style scoped>
.charter-wrapper {
  width: 100%;
  height: calc(100% - var(--height-header));
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

* {
  user-select: none;
}

</style>
