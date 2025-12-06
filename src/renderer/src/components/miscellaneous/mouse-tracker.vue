<script setup lang="ts">

import { GlobalStat } from '@renderer/core/globalStat'
import { computed } from 'vue'
import { Storage } from '@renderer/core/storage'

const pos = GlobalStat.MouseTracker.mouse_pos
const sty = computed(() => `top: ${pos.value.y}px; left: ${pos.value.x}px;`)
const shown = computed(() => Storage.data.value.settings.mouse_tracker)
</script>

<template>
  <div class="mouse-tracker" :style="sty" v-if="shown"></div>
</template>

<style scoped>
.mouse-tracker {
  z-index: 202;
  position: absolute;
  transform: translate(-50%, -50%);
  border: 6px solid #ff6363;
  pointer-events: none;
  border-radius: 6px;
}
</style>
