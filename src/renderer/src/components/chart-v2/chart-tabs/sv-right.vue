<script lang="ts" setup>
import { Settings } from '@renderer/core/settings'
import { Chart } from '@renderer/core/chart/chart'
import FnEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-editor.vue'
import FnTime from '@renderer/components/chart-v2/chart-tabs/small/fn-time.vue'
import SvEditor from '@renderer/components/chart-v2/chart-tabs/small/sv-editor.vue'

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
    <sv-editor />
  </div>
</template>

<style scoped>
input {
  width: 100%;
}

td {
  text-align: center;
}

.fn-right-inner {
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-template-rows: 1fr 1fr;
  gap: 15px 0;
  text-align: center;
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
