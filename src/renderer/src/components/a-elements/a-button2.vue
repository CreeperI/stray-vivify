<script setup lang="ts">
const {msg} = defineProps<{msg: string}>()
</script>

<template>
  <div class="a2-button" v-html="msg" />
</template>

<style scoped>
.a2-button {
  border-radius: 3px;
  background:var(--purple-bgi);
  line-height: 1.6rem;
  height: 1.6rem;
  cursor: pointer;
  user-select: none;
  padding: 0 5px;
  width: min-content;
  text-wrap: nowrap;
  text-align: center;
  transition: transform 0.1s ease-out;
}
.a2-button:hover {
  transform: scale(1.1);
}
</style>
