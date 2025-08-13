<script setup lang="ts">

import { Chart } from '@renderer/core/chart/chart'
import { utils } from '@renderer/core/utils'

const chart = Chart.$current
const current_time = chart.audio.refs.writable_current_second
</script>

<template>
  <div class="footer">
    <div class="left-fn">
      <div class="foot-time">{{utils.toTimeStr(current_time)}}</div>
    </div>
  </div>
</template>

<style scoped>
.footer {
  width: 100%;
  height: 80px;
  position: relative;
  border: 0;
  left: 0;
}
</style>
