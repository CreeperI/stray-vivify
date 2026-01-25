<script setup lang="ts">
import { Storage } from '@renderer/core/storage'
import { Chart } from '@renderer/core/chart/chart'
import { FrameRate } from '@renderer/core/misc/frame-rates'
const chart = Chart.$current
const fps = FrameRate.fps.last
const sync = FrameRate.audio_sync.refs
const nextT = FrameRate.next_tick.refs
</script>

<template>
  <div v-if="Storage.settings.debug_window" class="fn-right-debugger">
    <div>Active Notes</div>
    <div>{{ chart.diff.shown.value.length }}x</div>
    <div>FPS</div>
    <div>{{fps.toFixed(1)}}</div>
    <div>audio sync</div>
    <div>{{sync.call_count.toFixed(1)}}/s</div>
    <div>NextTick</div>
    <div>{{nextT.avg.toFixed(2)}}ms</div>
  </div>
</template>

<style scoped>

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
