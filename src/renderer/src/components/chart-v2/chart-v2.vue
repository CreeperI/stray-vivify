<script lang="ts" setup>
import SvgLane from '@renderer/components/chart-v2/chart-tabs/svg-lane.vue'
import HeaderV2 from '@renderer/components/chart-v2/header-v2.vue'
import LaneLeft from '@renderer/components/chart-v2/chart-tabs/lane-left.vue'
import LaneRight from '@renderer/components/chart-v2/chart-tabs/lane-right.vue'
import SongInfo from '@renderer/components/chart-v2/chart-tabs/song-info.vue'
import { Settings } from '@renderer/core/settings'
import ChartTiming from '@renderer/components/chart-v2/chart-tabs/chart-timing.vue'
import { GlobalStat } from '@renderer/core/globalStat'
import Preview from '@renderer/components/chart-v2/preview.vue'
import Playfield from '@renderer/components/chart-v2/playfield.vue'
import { onUnmounted } from 'vue'

const active = GlobalStat.refs.chart_tab
active.value = 2

function on_keydown(e: KeyboardEvent) {
  if (e.key != 'Tab') return
  e.preventDefault()
  active.value += 1
  if (active.value > 3) active.value = 1
}

document.addEventListener('keydown', on_keydown)

onUnmounted(() => {
  document.removeEventListener('keydown', on_keydown)
})

const _meters = [1, 4, 8, 12, 16, 24, 32, 48, 64]
function fuck_wheel(e: WheelEvent) {
  if (e.ctrlKey) {
    Settings.data.value.settings.scale = Number(
      Math.max(1, Math.min(Settings.editor.scale - 0.001 * e.deltaY, 20)).toFixed(1)
    )
  } else if (e.altKey) {
    const current_meter_left = _meters.findIndex((v) => v >= Settings.editor.meter)
    if (current_meter_left == -1) return
    Settings.data.value.settings.meter =
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
      <div v-else-if="active == 2" class="chart-main">
        <lane-left class="chart-fn" />
        <svg-lane class="svg-lane" />
        <lane-right class="chart-fn" />
      </div>
      <chart-timing v-if="active == 3"></chart-timing>
    </template>
    <preview v-if="chart_state == 1" />
    <playfield v-if="chart_state == 2" />
  </div>
</template>

<style scoped>
.chart-v2-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.chart-main {
  display: flex;
  flex-direction: row;
  width: 100%;
  flex-grow: 1;
  justify-content: space-around;
  position: relative;
}

.svg-lane {
  z-index: 2;
}

.chart-fn {
  z-index: 1;
}

@media screen and (max-width: 650px) {
  .chart-fn {
    display: none;
  }
}
.footer {
  z-index: 3;
  width: 100%;
  height: 80px;
  position: absolute;
  left: 0;
  bottom: 0;
  background: var(--dark-bgi);
}
</style>
