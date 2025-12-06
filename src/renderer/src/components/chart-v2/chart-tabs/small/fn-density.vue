<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { computed, onMounted, ref } from 'vue'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { utils } from '@renderer/core/utils'

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
  if (data.value.findIndex((v) => v > 0) == -1) return
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

const seeker = ref({ time: 0, display: false, x: 0 })
let flag = false
function mousemove(e: MouseEvent) {
  // of svg's
  const x = e.offsetX - 20 // the start of the path
  if (x < 0 || x > width) {
    seeker.value.display = false
    return
  }
  seeker.value.time = Math.floor((x / width) * chart.length)
  seeker.value.display = true
  seeker.value.x = e.offsetX
  if (flag) {
    chart.audio.set_current_time(seeker.value.time)
  }
}
function mouseout() {
  seeker.value.display = false
  flag = false
}
function mousedown() {
  flag = true
}
function mouseup() {
  flag = false
}
function click() {
  chart.audio.set_current_time(seeker.value.time)
}
</script>

<template>
  <div class="density-wrapper" style="user-select: none">
    <div class="density-title" @click="update_path()">
      <word-helper dec="点击以刷新" msg="线密度" />
    </div>
    <svg
      :width="width"
      height="250"
      preserveAspectRatio="none"
      @mousedown="mousedown"
      @mousemove="mousemove"
      @mouseout="mouseout"
      @mouseup="mouseup"
      @click="click"
    >
      <path :d="path" fill="none" stroke="white" stroke-width="1" class="no-event" />
      <g class="no-event">
        <text v-for="y in dy" :y="y[0]" dy="5" fill="white" font-size="10" text-anchor="end" x="15">
          {{ y[1].toFixed(0) }}
        </text>
        <line
          v-for="y in dy"
          :x2="width"
          :y1="y[0]"
          :y2="y[0]"
          stroke="white"
          stroke-dasharray="2,2"
          stroke-width="1"
          x1="20"
        />
      </g>
      <line
        v-if="seeker.display"
        :x1="seeker.x"
        :x2="seeker.x"
        class="no-event"
        stroke="white"
        stroke-width="1"
        y1="10"
        y2="240"
      />
      <text
        v-if="seeker.display"
        :x="seeker.x"
        fill="white"
        font-size="10"
        text-anchor="middle"
        y="250"
        class="no-event"
      >
        {{ utils.toTimeStr(seeker.time / 1000, 0) }}
      </text>
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
