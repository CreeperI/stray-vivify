<script setup lang="ts">

import ModalBase from '@renderer/components/modals/modalBase.vue'
const {msg} = defineProps<{msg: string}>()
</script>

<template>
  <modal-base>
    {{msg}}
  </modal-base>
</template>

<style scoped>

</style>
