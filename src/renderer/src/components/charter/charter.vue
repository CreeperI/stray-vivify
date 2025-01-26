<script setup lang="ts">

import Lane from "@renderer/components/charter/lane.vue";
</script>

<template>
  <div class="charter-wrapper">
    <Lane />
  </div>
</template>

<style scoped>
.charter-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  padding-left: 30px;
  z-index: 1;
}
</style>
