<script lang="ts" setup>
import { Charter } from '@renderer/core/charter'

const { href } = defineProps<{ href: string }>()

function handle() {
  Charter.invoke.open_url(href)
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
