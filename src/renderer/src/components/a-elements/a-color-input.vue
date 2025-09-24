<script setup lang="ts">
const model = defineModel<string>()
</script>

<template>
  <div class="a-color-input">
    <div></div>
    <input
      type="color"
      v-model="model"
    />
    <div>{{ model }}</div>
  </div>
</template>

<style scoped>
.a-color-input {
  display: grid;
  grid-template-columns:1fr 1fr 6em;
}
input[type=color] {
  border: none;
  cursor: pointer;
  box-shadow: 0 0 2px white;
  text-align: right;
}
div {
  user-select: none;
}
</style>
