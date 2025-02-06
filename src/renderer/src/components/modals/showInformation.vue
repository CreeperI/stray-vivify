<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'

const { msg } = defineProps<{ msg: string }>()
</script>

<template>
  <simple-modal size="m">
    {{ msg }}
    <template #footer>
      <button class="btn btn-primary" @click="$emit('close')">OK</button>
    </template>
  </simple-modal>
</template>

<style scoped></style>
