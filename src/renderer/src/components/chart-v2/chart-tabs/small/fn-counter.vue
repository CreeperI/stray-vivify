<script setup lang="ts">
import { Chart } from '@renderer/core/chart/chart'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Settings } from '@renderer/core/settings'
import { utils } from '@renderer/core/utils'
import { computed } from 'vue'
import { ChartTypeV2 } from '@preload/types'

const chart = Chart.$current
const counts = chart.diff.counts
const sr = chart.diff.sr

function getTotalStyle(name) {
  if (!Settings.settings.value.settings.colorize_star_rating) {
    return { style: {} }
  }
  const val = sr.value[name]
  const colObj = utils.GML_style_hsv_to_hsl(utils.clamp(55 + val / 4, 0, 255), 200, 255)

  return {
    stat_style: { color: `hsl(${colObj.h},${colObj.s}%,${colObj.l}%)` },
  }
}

function getStatStyle(statName: keyof ChartTypeV2.SongStats) {
  const val = sr.value[statName]

  if (!Settings.settings.value.settings.colorize_star_rating) {
    return { style: {}, isRainbow: false }
  }

  if (val < 200) {
    const colObj = utils.GML_style_hsv_to_hsl(55 + (200 * (val / 200)), 200, 255)

    // console.log("VAL<200")
    // console.log(styleObj)
    return {
      stat_style: { color: `hsl(${colObj.h}, ${colObj.s}%, ${colObj.l}%)` },
      isRainbow: false
    }

  }
  else if (val >= 200 && val < 400) {
    const lightness = 50 + 50 * ((val - 200) / 200);

    // console.log("200<=VAL<400")
    // console.log(styleObj)
    return {
      //用于控制hsl循环内的lightness
      stat_style: { '--stat-lightness': lightness + "%" },
      isRainbow: true
    }

  }
  else {

    //console.log(styleObj)

    return {
      stat_style: { color: "white" },
      isRainbow: false
    }
  }
}

const __style_note = computed(() => getStatStyle("note"))
const __style_speed = computed(() => getStatStyle("speed"))
const __style_tech = computed(() => getStatStyle("tech"))
const __style_fill = computed(() => getStatStyle("fill"))
const __style_multi = computed(() => getStatStyle("multi"))
const __style_total = computed(() => getTotalStyle("total_v3"))
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
      <label :class="{ 'rainbow-text-color-stat': __style_note.isRainbow }"
        :style="__style_note.stat_style">
        {{ sr.note.toFixed(2) }}
      </label>

      <div>STREAM</div>
      <label :class="{ 'rainbow-text-color-stat': __style_speed.isRainbow }"
        :style="__style_speed.stat_style">
        {{ sr.speed.toFixed(2) }}
      </label>

      <div>TECH</div>
      <label :class="{ 'rainbow-text-color-stat': __style_tech.isRainbow }"
        :style="__style_tech.stat_style">
        {{ sr.tech.toFixed(2) }}
      </label>

      <div>BURST</div>
      <label :class="{ 'rainbow-text-color-stat': __style_fill.isRainbow }"
        :style="__style_fill.stat_style">
        {{ sr.fill.toFixed(2) }}
      </label>

      <div>CHORD</div>
      <label :class="{ 'rainbow-text-color-stat': __style_multi.isRainbow }"
        :style="__style_multi.stat_style">
        {{ sr.multi.toFixed(2) }}
      </label>
      <!-- total-v2在实际游戏中已经被完全废弃了，所以改成total-OLD；v3在本体只存在于制谱器界面，且将其记作stat_total，所以这里也记成total-->
      <div>Total</div>
      <label :style="__style_total.stat_style">{{ sr.total_v3.toFixed(2) }}</label>
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


.rainbow-text-color-stat {
  animation: a-rainbow-cycle-stat 0.7s infinite linear;
}
</style>
