<script lang="ts" setup>
import ui from '@renderer/core/ui'
import { watch } from 'vue'
import Translations from '@renderer/core/translations'
import ASelect from '@renderer/components/a-elements/a-select.vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import ARange from '@renderer/components/a-elements/a-range.vue'

const setting = ui.charter.settings
const { scale, meter } = setting
const Language = Translations

watch(scale, (v) => {
  if (isFinite(Number(v))) {
    v = Math.floor(v * 10) / 10
    scale.value = Math.min(Math.max(Number(v), 0.1), 20)
  } else scale.value = 1
})

watch(meter, (v) => {
  if (isFinite(Number(v))) {
    v = Math.floor(v)
    meter.value = Math.min(Math.max(Number(v), 1), 64)
  } else meter.value = 4
})

if (!ui.chart) throw new Error('')
const chart = ui.chart
const { diff, diff_flag, diff_index, currentTimeRef, play_rate_ref } = ui.chart

function toTimeStr(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return minutes + ':' + (parseFloat(secs) < 10 ? '0' : '') + secs
}
</script>

<template>
  <div class="fp-unit">
    <div class="fp-title" v-html="Language.fp.chart.title"></div>
    <div class="chart-settings">
      <label v-html="Language.fp.song.composer"></label>
      <a-text-input v-model="chart.song.composer" @change="chart.refresh()" />
      <label v-html="Language.fp.song.name"></label>
      <a-text-input v-model="chart.song.name" @change="chart.refresh()" />
      <label v-html="Language.fp.chart.name"></label>
      <a-text-input v-model="diff.name" type="text" @input="chart.refresh()" />
      <label v-html="Language.fp.chart.level" />
      <a-text-input v-model="diff.hard" type="text" />
      <label v-html="Language.fp.song.bpm" />
      <a-number-input v-model="chart.song.bpm" min="0" step="0.01" />
      <label v-html="Language.fp.chart.choose" />
      <a-select
        :key="diff_flag"
        v-model="diff_index"
        :options="
          chart.diffs.map((v, i) => {
            return { key: v.name, val: i }
          })
        "
      />
      <label>{{ toTimeStr(currentTimeRef) }}/{{ toTimeStr(chart.length / 1000) }}</label>
      <a-range v-model="currentTimeRef" :max="chart.length / 1000" min="0" step="0.1" />
      <label v-html="Language.fp.chart.rate + ':' + play_rate_ref + 'x'" />
      <a-range v-model="play_rate_ref" max="2" min="0.5" step="0.1" type="range" />
    </div>
    <div class="chart-other">
      <div class="add-diff-btn" @click="chart.createDiff" v-html="Language.fp.chart.create" />
      <div class="add-diff-btn" @click="chart.deleteDiff" v-html="Language.fp.chart.del"></div>
    </div>
  </div>
</template>

<style scoped>
.chart-other {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
  justify-content: center;
}

.chart-other > div {
  flex-basis: 200px;
}

.add-diff-btn {
  cursor: pointer;
  background-color: #444;
  margin: 5px;
  line-height: 1.5rem;
  text-align: center;
}

.chart-settings {
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-template-rows: 1fr 1fr;
  gap: 15px 0;
}

.chart-settings > input {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
  border-bottom: 1px solid transparent;
}

.chart-settings > input:focus {
  border-bottom: 1px solid var(--grey);
}

.chart-settings > select {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
}

.chart-settings > option {
  background-color: transparent;
  border-radius: 0;
  appearance: none;
  color: black;
}

.chart-settings > * {
  text-align: center;
}
</style>
