<script setup lang="ts">
import { Chart } from '@renderer/core/chart/chart'
import { computed, onMounted, ref } from 'vue'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'

const chart = Chart.$current
const width = 300 + 20
const data = chart.diff.density_data
const path = ref('')

const dy = computed(() => {
  const max = Math.max(...data.value)
  return [0, 0.25, 0.5, 0.75, 1].map((v) => [240 - Math.floor(v * 230), v * max])
})
let is_drawing = false
async function update_path() {
  if (is_drawing) return
  chart.diff.calc_density()
  path.value = 'M 20 240'
  const max = Math.max(...data.value)
  const dx = width / data.value.length
  const dt = 1500 / data.value.length
  is_drawing = true
  for (let i = 0; i < data.value.length; i++) {
    const y = 240 - Math.floor((data.value[i] / max) * 230)
    path.value += `L ${(dx * i + 20).toFixed(3)} ${y}`
    await new Promise((r) => setTimeout(r, dt))
  }
  is_drawing = false
}

onMounted(() => {
  update_path()
})
</script>

<template>
  <div style="user-select: none" class="density-wrapper">
    <div class="density-title" @click="update_path()">
      <word-helper msg="线密度" dec="点击以刷新" />
    </div>
    <svg :width="width" height="250" preserveAspectRatio="none">
      <path :d="path" stroke="white" stroke-width="1" fill="none" />
      <g>
        <text v-for="y in dy" x="15" :y="y[0]" text-anchor="end" fill="white" dy="5" font-size="10">
          {{ y[1].toFixed(0) }}
        </text>
        <line
          v-for="y in dy"
          x1="20"
          :x2="width"
          :y1="y[0]"
          :y2="y[0]"
          stroke="white"
          stroke-width="1"
          stroke-dasharray="2,2"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.density-title {
  text-align: center;
  cursor: pointer;
}
.density-wrapper {
  columns: 1;
  overflow-x: hidden;
  text-align: center;
}
</style>
