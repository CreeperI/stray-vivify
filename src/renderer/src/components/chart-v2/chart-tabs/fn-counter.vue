<script setup>
import { Chart } from '@renderer/core/chart/chart'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Settings } from '@renderer/core/settings'

const counts = Chart.$current.diff.counts
const sr = Chart.$current.diff.sr
</script>
<template>
  <div style="user-select: none">
    <div class="counter-title">统计</div>
    <div class="counter-inner">
      <div>单键</div>
      <div>{{ counts.chip }}</div>
      <div>面</div>
      <div>{{ counts.hold }}</div>
      <div>宽键</div>
      <div>{{ counts.bumper }}</div>
      <div>宽面</div>
      <div>{{ counts.hold_bumper }}</div>
      <div>雷</div>
      <div>{{ counts.bomb }}</div>
      <div>s</div>
      <div>{{ counts.s }}</div>
      <div>总计</div>
      <div>{{ counts.total }} ({{counts.total1}})</div>
      <div>平均密度</div>
      <div>{{ counts.avg_density.toFixed(2) }}</div>
      <div>BPM</div>
      <div>{{ counts.min_bpm }} ~ {{ counts.max_bpm }}</div>
      <div>(Mainly</div>
      <div>{{ counts.main_bpm }})</div>
    </div>
    <div v-if="Settings.editor.star_rating" class="counter-sr">
      <div>
        <word-helper :msg="`SR ${sr.sr.toFixed(2)}*`" dec="开玩笑的"></word-helper>
      </div>
      <div>Chord</div>
      <div>{{ sr.chord }}</div>
      <div>Burst</div>
      <div>{{ sr.burst }}</div>
      <div>Tech</div>
      <div>{{ sr.tech }}</div>
      <div>Stream</div>
      <div>{{ sr.stream }}</div>
    </div>
  </div>
</template>
<style scoped>
.note-width > div,
.note-width > span,
.note-snb > div,
.note-snb > s {
  text-align: center;
  line-height: 1.5rem;
  height: 1.5rem;
}

.note-width > div {
  cursor: pointer;
  transition: background-color 0.2s;
}

.note-pending > img {
  position: relative;
  max-width: 90%;
}

.counter-title {
  text-align: center;
}

.counter-inner {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 0 15px;
}

.counter-inner div:nth-child(2n + 1),
.counter-sr div:nth-child(2n) {
  text-align: right;
}

.counter-inner div:nth-child(2n),
.counter-sr div:nth-child(2n + 1) {
  text-align: left;
}

.counter-sr div:first-child {
  grid-column: 1 / 5;
  text-align: center;
}

.counter-sr {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 0 15px;
}
</style>
