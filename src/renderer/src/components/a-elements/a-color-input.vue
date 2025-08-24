<script setup lang="ts">
const model = defineModel<string>()
</script>

<template>
  <div class="a-color-input">
    <input
      type="color"
      v-model="model"
    />
    <div>{{ model }}</div>
  </div>
</template>

<style scoped>
.a-color-input {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}
input[type=color] {
  border: none;
  cursor: pointer;
  box-shadow: 0 0 2px white;
}
div {
  user-select: none;
}
</style>
