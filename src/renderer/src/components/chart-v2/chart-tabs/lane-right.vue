<script lang="ts" setup>
import { Settings } from '@renderer/core/settings'
import { Chart } from '@renderer/core/chart/chart'
import FnEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-editor.vue'
import FnTime from '@renderer/components/chart-v2/chart-tabs/small/fn-time.vue'

const chart = Chart.$current
</script>

<template>
  <div class="fn-wrapper">
    <fn-editor />
    <fn-time />
    <div v-if="Settings.editor.debug_window" class="fn-right-debugger">
      <div>Active Notes</div>
      <div>{{ chart.diff.shown.value.length }}x</div>
    </div>
  </div>
</template>

<style scoped>
.table-set {
  height: min-content;
}

input {
  width: 100%;
}

td {
  text-align: center;
}

.meter-button {
  text-align: center;
  cursor: pointer;
  width: calc(75% / 9);
  box-sizing: content-box;
  border: 4px solid transparent;
  transition: 0.2s linear background-color;
}

.meter-button:hover {
  background: #444;
}

.fn-right-inner > input {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
  border-bottom: 1px solid transparent;
}

.fn-right-inner > input:focus {
  border-bottom: 1px solid var(--grey);
}
.fn-right-debugger {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 15px;
  text-align: left;
}
.fn-right-debugger > div {
  width: 100%;
}
.fn-right-debugger > div:nth-child(2n + 1) {
  text-align: right;
}
</style>
