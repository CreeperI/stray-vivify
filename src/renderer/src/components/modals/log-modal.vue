<script setup lang="ts">
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { Log } from '@renderer/core/log'
import { computed, ref } from 'vue'

const logs = computed(() => {
  if (level.value == "all") return Log.error_list.value
  else return Log.error_list.value.filter(l => l.level == level.value)
})
function toLocalDate(t: number) {
  return new Date(t).toTimeString().substring(0, 8)
}
const count = Log.count
const level = ref("all" as "all" | "debug" | "msg" | "warn" | "err")
</script>

<template>
  <SimpleModal title="Log" size="lg">
      <template class="counter">
        <div @click="level = 'debug'">Debug: {{count.debug}}</div>
        <div @click="level = 'msg'">Msg: {{count.msg}}</div>
        <div @click="level = 'warn'">Warn: {{count.warn}}</div>
        <div @click="level = 'err'">Error: {{count.err}}</div>
        <div @click="level = 'all'">All: {{count.all}}</div>
        <div>信息等级：{{level}}</div>
      </template>
    <div class="log-wrapper">
      <div v-for="l in logs" :class="l.level">
        <div>{{ toLocalDate(l.time) }}</div>
        <div>{{ l.msg }}</div>
      </div>
    </div>
  </SimpleModal>
</template>

<style scoped>
.log-wrapper {
  height: 55vh;
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
}
.counter {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  padding-bottom: 2rem;
  margin-left: 5%;
}
.counter > div:not(:last-child) {
  cursor: pointer;
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
