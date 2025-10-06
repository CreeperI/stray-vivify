<script setup lang="ts">
import { GlobalStat } from '@renderer/core/globalStat'

const { word, shown, position } = GlobalStat.WordHelper
</script>

<template>
  <transition name="fade-0.2">
    <div
      class="word-helper-overlay"
      v-html="word"
      v-if="shown"
      :style="{ left: position[0] + 'px', top: position[1] + 'px' }"
    />
  </transition>
</template>

<style scoped>
.word-helper-overlay {
  position: absolute;
  z-index: 201; /* because the vue-modal is 200*/
  background:var(--darker-bgi);
  padding: 5px 15px;
  border: 2px solid #b8dcee;
  user-select: none;
  pointer-events: none;
  max-width: 40vw;
}
</style>
