<script setup lang="ts">
const model = defineModel<number>({required: true})

function wheel(e: WheelEvent) {
  if (e.target instanceof HTMLInputElement) {
    e.target.blur()
    model.value -= Math.sign(e.deltaY)
    e.target.focus()
  }
}
</script>

<template>
  <input @wheel.prevent="wheel" v-model="model" type="number" />
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
  box-sizing: border-box;
}
input:focus {
  border-bottom: 1px solid var(--grey);
}
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
