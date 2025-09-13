<script setup lang="ts">
import { ref } from 'vue'

const shown = ref(true)
defineProps<{ src: string }>()
</script>

<template>
    <img :src="src" alt="" @error="shown = false" v-if="shown" />
</template>

<style scoped></style>
