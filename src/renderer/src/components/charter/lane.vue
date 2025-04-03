<script lang="ts" setup>
import LaneNotes from '@renderer/components/charter/LaneNotes.vue'
import { Charter } from '@renderer/core/charter'

const chart = Charter.get_chart()

const { meter, reverse_scroll } = Charter.settings.to_refs

const { current_bpm } = chart
const { writable_current_ms } = chart.audio.refs

function fuckWheel(e: WheelEvent) {
  chart.audio.pause()
  if (!e.target) return
  chart.audio.current_time = chart.diff.nearest(writable_current_ms.value)
  const scr = (4 / meter.value) * (60 / current_bpm.value) * Math.sign(e.deltaY)
  if (reverse_scroll.value) {
    writable_current_ms.value += scr * 1000
  } else {
    writable_current_ms.value += -scr * 1000
  }
}

const refresh = Charter.refresh.flag

/**
 * 0: 0px
 * 1: 131 + 6
 * 2: 131*2 + 6*2
 * 3: 131*3 + 6*3
 * 4: 131*4 + 6*4
 * */
</script>

<template>
  <div v-if="refresh" class="lane-wrapper" @wheel.passive="fuckWheel">
    <canvas id="charter-canvas" class="charter-canvas" height="1080" width="624" />
    <div class="lane-inner">
      <div class="lane-line" style="background-color: #ffffff; left: 0" />
      <div class="lane-line" style="background-color: #ffffff; left: 548px" />
      <div class="lane-line" style="background-color: #003b63; left: 137px" />
      <div class="lane-line" style="background-color: #45337c; left: 274px" />
      <div class="lane-line" style="background-color: #60003a; left: 411px" />
      <div class="lane-bg" style="background-color: #001523; left: 5px" />
      <div class="lane-bg" style="background-color: #270017; left: 279px" />
      <div class="lane-bottom" />
      <lane-notes />
    </div>
  </div>
</template>

<style scoped>
.lane-wrapper {
  box-shadow: black 0 0 15px;
  flex-basis: 662px;
  padding: 0 40px;
  background: var(--dark-bgi);
  position: relative;
}

.lane-inner {
  width: 622px;
  height: 100%;
  position: relative;
  padding: 0;
  border-right: 2px solid #8d8d8d;
}

.lane-bottom {
  position: relative;
  top: calc(100% - var(--h-l-b));
  width: calc(564px - 22px);
  box-sizing: content-box;
  border: 6px solid #ffffff;
  background-color: #272727;
  height: var(--h-l-b);
  z-index: var(--z-lane-bottom);
}

.lane-line {
  width: 6px;
  height: 100%;
  border: 0;
  padding: 0;
  margin: 0;
  position: absolute;
  top: 0;
  z-index: var(--z-lane-line);
  user-select: none;
  pointer-events: none;
}

.lane-bg {
  width: 271px;
  height: 100%;
  position: absolute;
  top: 0;
  z-index: var(--z-lane-bg);
}

.charter-canvas {
  height: calc(100vh - var(--h-l-b));
  width: 664px;
  z-index: var(--z-lane-canvas);
  position: absolute;
  bottom: var(--h-l-b);
  left: 0;
  pointer-events: none;
  user-select: none;
}

.lane-bar-line {
  background-image: linear-gradient(to bottom, #ffffff 4px, transparent 4px);
}
</style>
