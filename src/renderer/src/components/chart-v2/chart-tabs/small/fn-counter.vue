<script setup>
import { Chart } from '@renderer/core/chart/chart'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Settings } from '@renderer/core/settings'
import { reactive } from 'vue'
import { utils } from '@renderer/core/utils'

const chart = Chart.$current
const counts = chart.diff.counts
const sr = chart.diff.sr

function getTotalStyle(name) {
  const val = this.sr[name]
  const colObj = utils.GML_style_hsv_to_hsl(utils.clamp(55 + val / 4, 0, 255), 200, 255)
  const styleObj = {
    stat_style: { color: `hsl(${colObj.h},${colObj.s}%,${colObj.l}%)` },
  };
  // console.log("VAL<200")
  // console.log(styleObj)
  return styleObj
}

function getStatStyle(statName) {
  const val = this.sr[statName]

  if (!Settings.settings.value.settings.colorize_star_rating) {
    return { style: styleObj, isRainbow: false }
  }

  if (val < 200) {
    const colObj = utils.GML_style_hsv_to_hsl(55 + (200 * (val / 200)), 200, 255)
    const styleObj = {
      stat_style: { color: `hsl(${colObj.h},${colObj.s}%,${colObj.l}%)` },
      isRainbow: false
    };
    // console.log("VAL<200")
    // console.log(styleObj)
    return styleObj

  }
  else if (val >= 200 && val < 400) {
    const lightness = 50 + 50 * ((val - 200) / 200);
    const styleObj = {
      //用于控制hsl循环内的lightness
      stat_style: { '--stat-lightness': lightness + "%" },
      isRainbow: true
    };
    // console.log("200<=VAL<400")
    // console.log(styleObj)
    return styleObj

  }
  else {
    const styleObj = {
      stat_style: { color: "white" },
      isRainbow: false
    }
    //console.log(styleObj)

    return styleObj
  }
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
      <label :style="getStatStyle('note').stat_style"
        :class="{ 'rainbow-text-color-stat': getStatStyle('note').isRainbow }">
        {{ sr.note.toFixed(2) }}
      </label>

      <div>STREAM</div>
      <label :style="getStatStyle('speed').stat_style"
        :class="{ 'rainbow-text-color-stat': getStatStyle('speed').isRainbow }">
        {{ sr.speed.toFixed(2) }}
      </label>

      <div>TECH</div>
      <label :style="getStatStyle('tech').stat_style"
        :class="{ 'rainbow-text-color-stat': getStatStyle('tech').isRainbow }">
        {{ sr.tech.toFixed(2) }}
      </label>

      <div>BURST</div>
      <label :style="getStatStyle('fill').stat_style"
        :class="{ 'rainbow-text-color-stat': getStatStyle('fill').isRainbow }">
        {{ sr.fill.toFixed(2) }}
      </label>

      <div>CHORD</div>
      <label :style="getStatStyle('multi').stat_style"
        :class="{ 'rainbow-text-color-stat': getStatStyle('multi').isRainbow }">
        {{ sr.multi.toFixed(2) }}
      </label>

      <!-- total-v2在实际游戏中已经被完全废弃了，所以改成total-OLD；v3在本体只存在于制谱器界面，且将其记作stat_total，所以这里也记成total-->
      <div>Total_OLD</div>
      <div :style="getTotalStyle('total_v2').stat_style">{{ sr.total_v2.toFixed(2) }}</div>
      <div>Total</div>
      <label :style="getTotalStyle('total_v3').stat_style">{{ sr.total_v3.toFixed(2) }}</label>
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

/* hsl循环 */
@keyframes rainbow-cycle-stat {
  0% {
    color: hsl(0, 100%, var(--stat-lightness, 50%));
  }

  8.3% {
    color: hsl(30, 100%, var(--stat-lightness, 50%));
  }

  16.7% {
    color: hsl(60, 100%, var(--stat-lightness, 50%));
  }

  25% {
    color: hsl(90, 100%, var(--stat-lightness, 50%));
  }

  33.3% {
    color: hsl(120, 100%, var(--stat-lightness, 50%));
  }

  41.7% {
    color: hsl(150, 100%, var(--stat-lightness, 50%));
  }

  50% {
    color: hsl(180, 100%, var(--stat-lightness, 50%));
  }

  58.3% {
    color: hsl(210, 100%, var(--stat-lightness, 50%));
  }

  66.7% {
    color: hsl(240, 100%, var(--stat-lightness, 50%));
  }

  75% {
    color: hsl(270, 100%, var(--stat-lightness, 50%));
  }

  83.3% {
    color: hsl(300, 100%, var(--stat-lightness, 50%));
  }

  91.7% {
    color: hsl(330, 100%, var(--stat-lightness, 50%));
  }

  100% {
    color: hsl(360, 100%, var(--stat-lightness, 50%));
  }
}

.rainbow-text-color-stat {
  animation: rainbow-cycle-stat 0.7s infinite linear;
}
</style>
