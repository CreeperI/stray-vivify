<script setup lang="ts">

import ATextInput from '@renderer/components/a-elements/a-text-input.vue'

const model = defineModel<string>()
const { name } = defineProps<{name: string}>()
</script>

<template>
  <div class="song-info-single">
    <div>{{name}}</div>
    <a-text-input v-model="model" class="sis-input" />
  </div>
</template>

<style scoped>
.song-info-single {
  position: relative;
  border-radius: 10px;
  padding: 15px;
  background: var(--dark-bgi);
}
.sis-input {
  border-bottom: 1px solid #b8dcee77;
  width: 90%;
}
</style>
