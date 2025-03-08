<script setup lang="ts">

import Lane from '@renderer/components/charter/lane.vue'
import FnRecording from '@renderer/components/charter/func/fn-recording.vue'
</script>

<template>
  <div class="record-wrapper">
    <Lane/>
    <fn-recording />
  </div>
</template>

<style scoped>
.record-wrapper {
  height: 100%;
  display: flex;
  background: #000;
  width: 100%;
  justify-content: center;
}
</style>
