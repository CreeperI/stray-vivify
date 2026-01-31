<script lang="ts" setup>
import { computed, ref } from 'vue'

import { Log } from '@renderer/core/misc/inspector'

const level = ref('all' as 'all' | 'debug' | 'msg' | 'warn' | 'err')

const logs = computed(() => {
  if (level.value === 'all') return Log.error_list.value
  return Log.error_list.value.filter((l) => l.level === level.value)
})

const count = Log.count

function toLocalDate(t: number) {
  return new Date(t).toTimeString().substring(0, 8)
}
</script>

<template>
  <div class="counter">
    <div @click="level = 'debug'">Debug: {{ count.debug }}</div>
    <div @click="level = 'msg'">Msg: {{ count.msg }}</div>
    <div @click="level = 'warn'">Warn: {{ count.warn }}</div>
    <div @click="level = 'err'">Error: {{ count.err }}</div>
    <div @click="level = 'all'">All: {{ count.all }}</div>
    <div title="点我！">信息等级：{{ level }}</div>
  </div>
  <div class="log-wrapper">
    <div v-for="l in logs" :class="l.level">
      <div>{{ toLocalDate(l.time) }}</div>
      <div>{{ l.msg }}</div>
    </div>
  </div>
</template>

<style scoped>
.counter {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  padding-bottom: 2rem;
  margin-left: 5%;
}
.counter > div:not(:last-child) {
  cursor: pointer;
}
.counter > div:last-child {
  cursor: help;
}
.log-wrapper {
  overflow: auto;
  width: calc(90% - 20px);
  display: flex;
  flex-direction: column;
  margin-left: 5%;
  background: var(--darker-bgi);
  margin-bottom: 5%;
  border: 2px solid white;
  padding: 5px;
  gap: 5px;
  flex-grow: 1;
}
.log-wrapper > div {
  display: grid;
  grid-template-columns: 5rem 1fr;
  word-break: break-all;
}
.warn {
  background: #f3ff1f66;
}
.err {
  background: darkred;
}
</style>
