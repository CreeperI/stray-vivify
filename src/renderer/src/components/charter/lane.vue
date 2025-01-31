<script lang="ts" setup>
import ui from '@renderer/core/ui'
import LaneNotes from '@renderer/components/charter/LaneNotes.vue'

const state = ui.state

/**
 * 0: 0px
 * 1: 131 + 6
 * 2: 131*2 + 6*2
 * 3: 131*3 + 6*3
 * 4: 131*4 + 6*4
 * */
</script>

<template>
  <div class="lane-wrapper">
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
</template>

<style scoped>
.lane-bottom {
  position: relative;
  top: calc(100% - var(--h-l-b));
  width: calc(564px - 22px);
  box-sizing: content-box;
  border: 6px solid #ffffff;
  background-color: #272727;
  height: var(--h-l-b);
  z-index: -2;
}

.lane-wrapper {
  --h-l-b: 80px;
  width: 622px;
  height: 100%;

  position: absolute;
  padding: 0;
  margin: 0;
  overflow: hidden;
  border-right: 2px solid #8d8d8d;
}

.lane-line,
.lane-sline {
  width: 6px;
  height: 100%;
  border: 0;
  padding: 0;
  margin: 0;
  z-index: -3;
  position: absolute;
  top: 0;
  user-select: none;
  pointer-events: none;
}

.lane-sline {
  z-index: 999;
}

.lane-bg {
  width: 271px;
  height: 100%;
  z-index: -4;
  position: absolute;
  top: 0;
}

.lane-bar-line {
  background-image: linear-gradient(to bottom, #ffffff 4px, transparent 4px);
}
</style>
