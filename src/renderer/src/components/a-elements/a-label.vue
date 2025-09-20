<script lang="ts" setup>
const { label } = defineProps<{
  label: string
}>()
</script>

<template>
  <div class="a-label">
    <slot />
    <span v-html="label" />
  </div>
</template>

<style scoped>
.a-label {
  display: flex;
  align-items: flex-start;
  width: min-content;
  gap: 0.5rem;
}
span {
  text-wrap: nowrap;
  text-align: left;
  vertical-align: center;
}
</style>
