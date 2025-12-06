<script lang="ts" setup>
import HeaderV2 from '@renderer/components/chart-v2/header-v2.vue'
import SongInfo from '@renderer/components/chart-v2/chart-tabs/song-info.vue'
import { Storage } from '@renderer/core/storage'
import ChartTiming from '@renderer/components/chart-v2/chart-tabs/chart-timing.vue'
import { GlobalStat } from '@renderer/core/globalStat'
import Preview from '@renderer/components/chart-v2/preview.vue'
import Playfield from '@renderer/components/chart-v2/playfield.vue'
import { onUnmounted } from 'vue'
import ChartMain from '@renderer/components/chart-v2/chart-tabs/chart-main.vue'
import ChartSv from '@renderer/components/chart-v2/chart-tabs/chart-sv.vue'

const active = GlobalStat.refs.chart_tab
active.value = 2

function on_keydown(e: KeyboardEvent) {
  if (e.key != 'Tab') return
  e.preventDefault()
  active.value += 1
  if (active.value > 4) active.value = 1
}

document.addEventListener('keydown', on_keydown)

onUnmounted(() => {
  document.removeEventListener('keydown', on_keydown)
})

const _meters = [1, 4, 8, 12, 16, 24, 32, 48, 64]
function fuck_wheel(e: WheelEvent) {
  if (e.ctrlKey) {
    Storage.data.value.settings.scale = Number(
      Math.max(1, Math.min(Storage.settings.scale - 0.001 * e.deltaY, 20)).toFixed(1)
    )
  } else if (e.altKey) {
    const current_meter_left = _meters.findIndex((v) => v >= Storage.settings.meter)
    if (current_meter_left == -1) return
    Storage.data.value.settings.meter =
      _meters[Math.max(current_meter_left - (e.deltaY > 0 ? 1 : -1), 0)] ?? 64
  }
}

const chart_state = GlobalStat.chart_state
</script>

<template>
  <div :data-cs="chart_state" class="chart-v2-wrapper" @wheel="fuck_wheel">
    <template v-if="chart_state == 0">
      <header-v2 v-model="active" />
      <song-info v-if="active == 1" />
      <chart-main v-if="active == 2" />
      <chart-timing v-if="active == 3" />
      <chart-sv v-if="active == 4" />
    </template>
    <preview v-if="chart_state == 1" />
    <playfield v-if="chart_state == 2" />
  </div>
</template>

<style scoped>
.chart-v2-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

</style>
