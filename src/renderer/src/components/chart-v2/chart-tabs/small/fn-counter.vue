<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Storage } from '@renderer/core/storage'
import StatLine from '@renderer/components/chart-v2/chart-tabs/small/stat-line.vue'

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

    <div v-if="Storage.settings.star_rating" class="counter-sr">
      <div @click="chart.diff.update_sr()">
        <word-helper :msg="`SR ${(sr.total_v3 / 50).toFixed(2)}*`" dec="开玩笑的"></word-helper>
      </div>
      <div>CHIP</div>
      <stat-line str="note" />
      <div>STREAM</div>
      <stat-line str="speed" />
      <div>TECH</div>
      <stat-line str="tech" />
      <div>BURST</div>
      <stat-line str="fill" />
      <div>CHORD</div>
      <stat-line str="multi" />
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
  grid-column: 1 / 3;
  text-align: center;
}

.counter-sr {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 0 15px;
}
</style>
