<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import Versions from '@renderer/components/credits/versions.vue'
</script>

<template>
  <SimpleModal size="4" title="Versions">
    <div class="versions-wrapper">
      <Versions />
    </div>
  </SimpleModal>
</template>

<style scoped>
.versions-wrapper {
  overflow-y: auto;
  max-height: 70vh;
}

::-webkit-scrollbar {
  background: transparent;
}
</style>
