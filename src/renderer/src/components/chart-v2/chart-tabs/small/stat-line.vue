<script lang="ts" setup>
import { computed } from 'vue'
import { Storage } from '@renderer/core/storage'
import { utils } from '@renderer/core/utils'
import { Chart } from '@renderer/core/chart/chart'
import { ChartTypeV2 } from '@preload/chart-types'

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
      width: width,
      bg: 'white',
      class_line: 'stat-white'
    }
  }
  if (val < 200) {
    const colObj = utils.GML_style_hsv_to_hsl(55 + 200 * (val / 200), 200, 255)
    const width = val / 2 + '%'

    return {
      bg: `hsl(${colObj.h}, ${colObj.s}%, ${colObj.l}%)`,
      class_line: '',
      width: width
    }
  } else if (val >= 200 && val < 400) {
    const width = (val - 200) / 2 + '%'
    return {
      //用于控制hsl循环内的lightness
      class_line: 'stat-rainbow',
      width: width,
      bg: 'white'
    }
  } else {
    return {
      class_line: '',
      width: '100%',
      bg: `linear-gradient(to right, red, orange, yellow, green)`
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
  return getStatStyle(props.str).class_line
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
.stat-white {
  background: white;
}
</style>
