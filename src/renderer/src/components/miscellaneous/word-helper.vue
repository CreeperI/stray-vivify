<script lang="ts" setup>
import { onUnmounted, useTemplateRef } from 'vue'
import { GlobalStat } from '@renderer/core/globalStat'

const prop = defineProps<{
  msg: string
  dec: string
}>()
const r = useTemplateRef('wh')
let flag = false
function _in() {
  if (!r.value) return
  const rect = r.value.getBoundingClientRect()
  GlobalStat.WordHelper.call_helper([rect.right, rect.bottom], prop.dec)
  flag = true
}
function _out() {
  GlobalStat.WordHelper.hide_helper()
  flag = false
}
onUnmounted(() => {
  if (flag) GlobalStat.WordHelper.hide_helper()
})
</script>

<template>
  <span>
    <span ref="wh" class="word-helper" @mouseenter="_in" @mouseleave="_out" v-html="msg" />
  </span>
</template>

<style scoped>
.word-helper {
  text-decoration: underline #b8dcee 1px;
  cursor: help;
  user-select: none;
}
</style>
