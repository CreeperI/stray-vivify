<script lang="ts" setup>
import Lane from '@renderer/components/charter/lane.vue'
import FuncPanel from '@renderer/components/charter/func-panel.vue'
</script>

<template>
  <div class="charter-wrapper">
    <Lane />
    <FuncPanel />
  </div>
</template>

<style scoped>
.charter-wrapper {
  width: 100%;
  height: calc(100% - var(--height-header));
  overflow: hidden;
  position: relative;
  padding-left: 30px;
  z-index: 1;
  display: flex;
  flex-direction: row;
}
</style>
