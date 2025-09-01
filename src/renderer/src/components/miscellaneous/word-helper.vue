<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { GlobalStat } from '@renderer/core/globalStat'

const prop = defineProps<{
  msg: string
  dec: string
}>()
const r = useTemplateRef('wh')
function _in() {
  if (!r.value) return
  const rect = r.value.getBoundingClientRect()
  GlobalStat.WordHelper.call_helper([rect.right, rect.bottom], prop.dec)
}
function _out() {
  GlobalStat.WordHelper.hide_helper()
}
</script>

<template>
  <span>
    <span class="word-helper" v-html="msg" ref="wh" @mouseenter="_in" @mouseleave="_out" />
  </span>
</template>

<style scoped>
.word-helper {
  text-decoration: underline #b8dcee 1px;
  cursor: help;
  user-select: none;
}
</style>
