<script setup lang="ts">
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import FullNotes from '@renderer/components/chart-v2/full-notes.vue'
</script>

<template>
  <SimpleModal size="lg">
    <div class="chart-preview-wrapper">
      <full-notes />
    </div>
  </SimpleModal>
</template>

<style scoped>
.chart-preview-wrapper {
  height: 100%;
  width: 100%;
  overflow: scroll;
}
</style>
