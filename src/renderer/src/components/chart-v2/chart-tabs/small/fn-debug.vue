<script lang="ts" setup>
import { Storage } from '@renderer/core/storage'
import { Chart } from '@renderer/core/chart/chart'
import { FrameRate } from '@renderer/core/misc/frame-rates'

const chart = Chart.$current
const fps = FrameRate.fps.last
const sync = FrameRate.audio_sync.refs
const nextT = FrameRate.next_tick.refs
</script>

<template>
  <div v-if="Storage.settings.debug_window" class="fn-debug">
    <div>Active Notes</div>
    <div>{{ chart.diff.shown.value.length }}x</div>
    <div>FPS</div>
    <div>{{ fps }}</div>
    <div>audio sync</div>
    <div>{{ sync.call_count.toFixed(1) }}/s</div>
    <div>NextTick</div>
    <div>{{ nextT.avg.toFixed(2) }}ms</div>
  </div>
</template>

<style scoped>
.fn-debug {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 15px;
  text-align: left;
}

.fn-debug>div {
  width: 100%;
}

.fn-debug>div:nth-child(2n + 1) {
  text-align: right;
}
</style>
