<script setup>
import { Chart } from '@renderer/core/chart/chart'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Settings } from '@renderer/core/settings'

const chart = Chart.$current
const counts = chart.diff.counts
const sr = chart.diff.sr
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
      <div>{{ counts.total }} ({{ counts.total1 }})</div>
      <div>平均密度</div>
      <div>{{ counts.avg_density.toFixed(2) }}</div>
      <div>BPM</div>
      <div>{{ counts.min_bpm }} ~ {{ counts.max_bpm }}</div>
      <div>(Mainly</div>
      <div>{{ counts.main_bpm }})</div>
    </div>
    <div v-if="Settings.editor.star_rating" class="counter-sr">
      <div @click="chart.diff.update_sr()">
        <word-helper :msg="`SR ${(sr.total_v2/75).toFixed(2)}*`" dec="开玩笑的"></word-helper>
      </div>
      <div>Note</div>
      <div>{{ sr.note.toFixed(2) }}</div>
      <div>speed</div>
      <div>{{ sr.speed.toFixed(2) }}</div>
      <div>tech</div>
      <div>{{ sr.tech.toFixed(2) }}</div>
      <div>fill</div>
      <div>{{ sr.fill.toFixed(2) }}</div>
      <div>multi</div>
      <div>{{ sr.multi.toFixed(2) }}</div>
      <div>total-v2</div>
      <div>{{ sr.total_v2.toFixed(2) }}</div>
      <div>total-v3</div>
      <div>{{ sr.total_v3.toFixed(2) }}</div>
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
