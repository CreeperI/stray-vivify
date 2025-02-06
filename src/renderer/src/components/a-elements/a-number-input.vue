<script setup lang="ts">
const model = defineModel<number>()
</script>

<template>
  <input v-model="model" type="number" />
</template>

<style scoped>
input {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
  border-bottom: 1px solid transparent;
}
input:focus {
  border-bottom: 1px solid var(--grey);
}
</style>
