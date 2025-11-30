<script setup lang="ts">

import ARange from '@renderer/components/a-elements/a-range.vue'
import { Chart } from '@renderer/core/chart/chart'
import { utils } from '@renderer/core/utils'
import { Settings } from '@renderer/core/settings'

const chart = Chart.$current
const { current_ms, writable_play_rate, play_rate, writable_current_second } = chart.audio.refs
</script>
<template>
  <div class="fn-right-inner">
    <label>
      {{ utils.toTimeStr(current_ms / 1000) }}/{{ utils.toTimeStr(chart.length / 1000) }}
    </label>
    <a-range v-model="writable_current_second" :max="chart.length / 1000" min="0" step="0.1" />
    <label @click="writable_play_rate = 1">播放速度:{{ play_rate }}x</label>
    <a-range v-model="writable_play_rate" max="2" min="0.25" step="0.05" />
    <label v-if="Settings.editor.hit_sound">打击音量: {{ Settings.editor.hit_volume }}</label>
    <a-range
      v-if="Settings.editor.hit_sound"
      v-model="Settings.editor.hit_volume"
      max="100"
      min="0"
      step="1"
    />
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

.fn-right-debugger > div {
  width: 100%;
}

.fn-right-debugger > div:nth-child(2n+1) {
  text-align: right;
}
</style>
