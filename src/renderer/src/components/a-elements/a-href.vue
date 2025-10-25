<script lang="ts" setup>


import { Invoke } from '@renderer/core/ipc'

const { href } = defineProps<{ href: string }>()

function handle() {
  Invoke('open-url', href)
}
</script>

<template>
  <a @click="handle">
    <slot></slot>
  </a>
</template>

<style scoped>
a {
  text-decoration: 1px underline #b8dcee;
  cursor: pointer;
}
</style>
