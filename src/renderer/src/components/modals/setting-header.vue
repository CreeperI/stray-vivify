<script setup lang="ts">
defineProps<{msg: string}>()
</script>

<template>
  <div class="settings-header" v-html="msg"/>
</template>

<style scoped>
.settings-header {
  font-size: 1.2em;
  font-weight: bold;
  height: 2rem;
  line-height: 2rem;
  text-align: center;
  display: block !important;
  margin: 10px 0;
}
</style>
