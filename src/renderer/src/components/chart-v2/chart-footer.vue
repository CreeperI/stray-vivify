<script setup lang="ts">

import { Chart } from '@renderer/core/chart/chart'
import { utils } from '@renderer/core/utils'

const chart = Chart.$current
const current_time = chart.audio.refs.writable_current_second
</script>

<template>
  <div>
    <div class="left-fn">
      <div class="foot-time">{{utils.toTimeStr(current_time)}}</div>
    </div>
  </div>
</template>

<style scoped>

.left-fn {
  display: flex;
  flex-direction: column;
}
.foot-time {
  font-size: 2rem;
}
</style>
