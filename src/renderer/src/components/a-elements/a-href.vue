<script lang="ts" setup>
import { Invoke } from '@renderer/core/ipc'

const { href } = defineProps<{ href: string }>()

function handle() {
  Invoke('open-url', {url: href })
}
</script>

<template>
  <a @click="handle">
    <slot></slot>
  </a>
</template>

<style scoped>
a {
  text-decoration: 2px underline #b8dcee;
  cursor: pointer;
  padding: 0 5px;
}
</style>
