<script setup lang="ts">

import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import Credits from '@renderer/components/credits/credits.vue'
</script>

<template>
  <SimpleModal size="lg" title="Credits">
    <div class="credits-wrapper">
      <Credits />
    </div>
  </SimpleModal>
</template>

<style scoped>
.credits-wrapper {
  overflow-y: auto;
  min-height: 60vh;
  max-height: 70vh;
}
</style>
