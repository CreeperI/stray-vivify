<script setup>
import { Chart } from '@renderer/core/chart/chart'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Settings } from '@renderer/core/settings'
import { reactive } from 'vue'
import { utils } from '@renderer/core/utils'
import { ref } from 'vue'

const chart = Chart.$current
const counts = chart.diff.counts
const sr = chart.diff.sr

function statSetNotRainbowColor(val) {
  const colObj = utils.GML_style_hsv_to_hsl(55 + (200 * (val / 200)), 200, 255)
  const statNotRainbowStyle =
  {
    color: `hsl(${colObj.h},${colObj.s}%,${colObj.l}%)`
  }
  return statNotRainbowStyle
}

function judgeStatStyle(val) {
  if (!Settings.settings.value.settings.colorize_star_rating) {
    return {}
  }

  if (val < 200) {
    console.log(statSetNotRainbowColor(val))
    return statSetNotRainbowColor(val)
  }
  else if (200 <= val && val < 400) {
    console.log("rb style")
    return {}

  }
  else {
    console.log("white")
    return { color: "white" }

  }
}

function judgeRainbowStat(val) {
  return (200 <= val) && (val < 400) && Settings.settings.value.settings.colorize_star_rating
}

//console.log("test")


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
        <word-helper :msg="`SR ${(sr.total_v2 / 75).toFixed(2)}*`" dec="开玩笑的"></word-helper>
      </div>

      <div>CHIP</div>
      <label :style="judgeStatStyle(sr.note)" :class="{ 'rainbow-text-color': judgeRainbowStat(sr.note) }">
        {{ sr.note.toFixed(2) }}
      </label>

      <div>STREAM</div>
      <label :style="judgeStatStyle(sr.speed)" :class="{ 'rainbow-text-color': judgeRainbowStat(sr.speed) }">
        {{ sr.speed.toFixed(2) }}
      </label>

      <div>TECH</div>
      <label :style="judgeStatStyle(sr.tech)" :class="{ 'rainbow-text-color': judgeRainbowStat(sr.tech) }">
        {{ sr.tech.toFixed(2) }}
      </label>

      <div>BURST</div>
      <label :style="judgeStatStyle(sr.fill)" :class="{ 'rainbow-text-color': judgeRainbowStat(sr.fill) }">
        {{ sr.fill.toFixed(2) }}
      </label>

      <div>CHORD</div>
      <label :style="judgeStatStyle(sr.multi)" :class="{ 'rainbow-text-color': judgeRainbowStat(sr.multi) }">
        {{ sr.multi.toFixed(2) }}
      </label>

      <div>total-v2</div>
      <div>{{ sr.total_v2.toFixed(2) }}</div>
      <div>total-v3</div>
      <div>{{ sr.total_v3.toFixed(2) }}</div>
    </div>
  </div>
</template>
<style scoped>
.note-width>div,
.note-width>span,
.note-snb>div,
.note-snb>s {
  text-align: center;
  line-height: 1.5rem;
  height: 1.5rem;
}

.note-width>div {
  cursor: pointer;
  transition: background-color 0.2s;
}

.note-pending>img {
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
