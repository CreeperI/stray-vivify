<script lang="ts" setup>
import ui from '@renderer/core/ui'
import LaneNotes from '@renderer/components/charter/LaneNotes.vue'

const state = ui.state
const meter = ui.charter.settings.meter
if (!ui.chart) throw new Error('fuck!')
const chart = ui.chart
const { currentBpm, currentTimeRef } = chart

function fuckWheel(e: WheelEvent) {
  chart.audio.pause()
  if (!e.target) return
  e.preventDefault()
  const scr = (4 / meter.value) * (60 / currentBpm.value) * Math.sign(e.deltaY)
  currentTimeRef.value -= scr
}

/**
 * 0: 0px
 * 1: 131 + 6
 * 2: 131*2 + 6*2
 * 3: 131*3 + 6*3
 * 4: 131*4 + 6*4
 * */
</script>

<template>
  <div class="lane-wrapper" @wheel="fuckWheel">
    <div class="lane-inner">
      <div class="lane-sline" style="background-color: #ffffff; left: 0" />
      <div class="lane-sline" style="background-color: #ffffff; left: 548px" />
      <div class="lane-line" style="background-color: #003b63; left: 137px" />
      <div class="lane-line" style="background-color: #45337c; left: 274px" />
      <div class="lane-line" style="background-color: #60003a; left: 411px" />
      <div class="lane-bg" style="background-color: #001523; left: 5px" />
      <div class="lane-bg" style="background-color: #270017; left: 279px" />
      <div class="lane-bottom" />
      <lane-notes v-if="state == 'charting'" />
    </div>
  </div>
</template>

<style scoped>
.lane-wrapper {
  width: 702px;
  box-shadow: black 0 0 15px;
  flex-basis: 702px;
  padding: 0 40px;
  background: var(--dark-bgi);
}

.lane-inner {
  width: 622px;
  height: 100%;
  position: relative;
  padding: 0;
  overflow: hidden;
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
  z-index: 114514;
}

.lane-line,
.lane-sline {
  width: 6px;
  height: 100%;
  border: 0;
  padding: 0;
  margin: 0;
  position: absolute;
  top: 0;
  z-index: 1;
  user-select: none;
  pointer-events: none;
}

.lane-sline {
  z-index: var(--z-highest);
}

.lane-bg {
  width: 271px;
  height: 100%;
  position: absolute;
  top: 0;
}

.lane-bar-line {
  background-image: linear-gradient(to bottom, #ffffff 4px, transparent 4px);
}
</style>
