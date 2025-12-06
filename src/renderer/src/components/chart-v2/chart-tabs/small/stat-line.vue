<script lang="ts" setup>
import { computed } from 'vue'
import { ChartTypeV2 } from '@preload/types'
import { Storage } from '@renderer/core/storage'
import { utils } from '@renderer/core/utils'
import { Chart } from '@renderer/core/chart/chart'

const props = defineProps<{
  str: keyof ChartTypeV2.SongStats
}>()

const chart = Chart.$current
const sr = chart.diff.sr

const value = computed(() => {
  return sr.value[props.str]
})

function getStatStyle(statName: keyof ChartTypeV2.SongStats) {
  const val = sr.value[statName]

  if (!Storage._ref.value.settings.color_stats) {
    const width = val > 400 ? '100%' : (val % 200) / 2 + '%'
    return {
      isRainbow: false,
      width: width,
      bg: "white"
    }
  }
  if (val < 200) {
    const colObj = utils.GML_style_hsv_to_hsl(55 + 200 * (val / 200), 200, 255)
    const width = val / 2 + '%'

    return {
      bg: `hsl(${colObj.h}, ${colObj.s}%, ${colObj.l}%)` ,
      isRainbow: false,
      width: width
    }
  } else if (val >= 200 && val < 400) {
    const width = (val - 200) / 2 + '%'
    return {
      //用于控制hsl循环内的lightness
      isRainbow: true,
      width: width,
      bg: "white"
    }
  } else {
    return {
      isRainbow: false,
      width: '100%',
      bg: "white"
    }
  }
}
const style_fill = computed(() => {
  const s = getStatStyle(props.str)
  return {
    width: s.width,
    background: s.bg
  }
})

const class_line = computed(() => {
  return getStatStyle(props.str).isRainbow ? 'stat-rainbow' : ''
})
</script>

<template>
  <div class="stat-line-wrapper">
    <div :class="class_line" class="stat-line">
      <div :style="style_fill" class="stat-line-fill"></div>
    </div>
    <div class="stat-line-str">{{ value.toFixed(2) }}</div>
  </div>
</template>

<style scoped>
.stat-line-wrapper {
  display: flex;
  width: 90%;
  align-items: center;
}

.stat-line {
  flex-grow: 1;
  height: 1rem;
  margin: 0 10px;
  max-width: 200px;
}
.stat-line-fill {
  height: 100%;
  transition: width 0.2s ease-in-out;
}
.stat-line-str {
  flex-basis: 3rem;
}
.stat-rainbow {
  animation: a-rainbow-cycle-stat 3s infinite linear;
}
</style>
