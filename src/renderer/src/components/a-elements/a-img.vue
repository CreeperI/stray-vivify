<script lang="ts" setup>
import { ref } from 'vue'

const shown = ref(true)
defineProps<{ src: string }>()
</script>

<template>
  <img v-if="shown" :src="src" alt="" @error="shown = false" />
</template>

<style scoped></style>
