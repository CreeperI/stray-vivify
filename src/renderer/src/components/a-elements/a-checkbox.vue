<script setup lang="ts">

const m = defineModel<boolean>()
</script>

<template>
  <input type="checkbox" v-model="m"/>
</template>

<style scoped>
input {
  vertical-align: center;
  align-self: center;
}
</style>
