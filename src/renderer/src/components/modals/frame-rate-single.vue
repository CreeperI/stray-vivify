<script setup lang="ts">
import { _FrameRateClass } from '@renderer/core/frame-rates'

const props = defineProps<{ msg: string; r: _FrameRateClass }>()
const r = props.r.refs
</script>

<template>
  <tr>
    <td>{{ msg }}</td>
    <td>{{ r.min.toFixed(1) }}/{{ r.max.toFixed(1) }}</td>
    <td>{{ r.avg.toFixed(2) }}</td>
    <td>{{ r.sd.toFixed(2) }}</td>
    <td>{{ r.cv.toFixed(2) }}</td>
    <td>{{ r.call_count.toFixed(1) }}</td>
  </tr>
</template>

<style scoped>
td {
  border: 1px solid white;
}
</style>
