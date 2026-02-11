<script setup lang="ts">
import { Chart } from '@renderer/core/chart/chart'
import { computed } from 'vue'

const chart = Chart.$current
const vsm = chart.vsm
const diff = chart.diff

const mod_index = vsm.refs.mod_index
const mod = computed(() => vsm.vsm.mods[mod_index.value])
</script>

<template>
  <div v-if="mod_index != -1" class="mod-editor">
    <div class="mod-header">{{mod.modname}} at {{diff.get_beat_string(mod.time)}}</div>
  </div>
</template>

<style scoped>
.mod-editor {
  display: grid;
  grid-template-columns: 1fr 2fr;

}
.mod-header {
  grid-column: 0 / 2;
}
</style>
