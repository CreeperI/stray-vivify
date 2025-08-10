<script setup lang="ts">
import SvgLane from '@renderer/components/chart-v2/svg-lane.vue'
import HeaderV2 from '@renderer/components/chart-v2/header-v2.vue'
import FnLeft from '@renderer/components/chart-v2/fn-left.vue'
import FnRight from '@renderer/components/chart-v2/fn-right.vue'
import { ref } from 'vue'
import SongInfo from '@renderer/components/chart-v2/song-info.vue'

const active = ref(2)
</script>

<template>
  <div class="chart-v2-wrapper">
    <header-v2 v-model="active" />
    <song-info v-if="active == 1"/>
    <div class="chart-main" v-if="active == 2">
      <fn-left class="chart-fn"/>
      <svg-lane class="svg-lane" />
      <fn-right class="chart-fn"/>
    </div>
  </div>
</template>

<style scoped>
.chart-v2-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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
</style>
