<script lang="ts" setup>
import { Charter } from '@renderer/core/charter'
import Translations from '../../../core/translations'

function toTimeStr(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return minutes + ':' + (parseFloat(secs) < 10 ? '0' : '') + secs
}

const chart = Charter.get_chart()
const { current_ms,  } = chart.audio.refs
const current_bpm = chart.current_bpm
</script>

<template>
  <div class="fn-recording">
    <div>stray/vivify by TerminalFlow</div>
    <br />
    <div>{{ Translations.charter_func.song.name }}:{{ chart.song.name }}</div>
    <div>{{ Translations.charter_func.song.composer }}:{{ chart.song.composer }}</div>
    <div>{{ Translations.charter_func.chart.name }}:{{ chart.diff.name }}</div>
    <div>{{ Translations.charter_func.chart.charter }}:{{ chart.diff.charter }}</div>
    <div>{{ Translations.charter_func.chart.level }}:{{ chart.diff.hard }}</div>
    <div>{{ Translations.charter_func.song.bpm }}:{{ chart.song.bpm }}</div>
    <br />
    <div>{{ toTimeStr(current_ms / 1000) }}/{{ toTimeStr(chart.length / 1000) }}</div>
    <div>BPM: {{ current_bpm }}</div>
  </div>
</template>

<style scoped>
.fn-recording {
  display: flex;
  border: none;
  position: absolute;
  left: 10px;
  top: 10px;
  flex-direction: column;
}
</style>
