<script lang="ts" setup>
import { computed, watch } from 'vue'
import Translations from '@renderer/core/translations'
import ASelect from '@renderer/components/a-elements/a-select.vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import ARange from '@renderer/components/a-elements/a-range.vue'
import { Charter } from '@renderer/core/charter'

const { scale, meter, volume } = Charter.settings.to_refs
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

const chart = Charter.get_chart()
const { diff } = chart
const { current_ms, writable_play_rate, play_rate, writable_current_second } = chart.audio.refs

const update_flag = Charter.update.flag

function toTimeStr(seconds: number) {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const minutes = Math.floor(absSeconds / 60);
  let secs = (absSeconds % 60).toFixed(3);

  // 处理秒数部分补零逻辑
  secs = parseFloat(secs) < 10 ? '0' + secs : secs;

  // 添加负号标识
  return (isNegative ? '-' : '') + minutes + ':' + secs;
}

const diff_index = computed({
  get() {
    return chart.ref.diff_index.value
  },
  set(v) {
    chart.diff_index = v
  }
})
</script>

<template>
  <div class="fp-unit">
    <div class="fp-title" v-html="Language.charter_func.chart.title"></div>
    <div class="chart-settings">
      <label v-html="Language.charter_func.song.composer"></label>
      <a-text-input v-model="chart.song.composer" @change="Charter.update()" />
      <label v-html="Language.charter_func.song.name"></label>
      <a-text-input v-model="chart.song.name" @change="Charter.update()" />
      <label v-html="Language.charter_func.chart.name"></label>
      <a-text-input v-model="diff.name" @input="Charter.update()" />
      <label v-html="Language.charter_func.chart.level" />
      <a-text-input v-model="diff.hard" />
      <label v-html="Language.charter_func.chart.charter" />
      <a-text-input v-model="diff.charter" @change="Charter.update()" />
      <label v-html="Language.charter_func.song.bpm" />
      <a-text-input v-model="chart.song.bpm" />
      <label v-html="Language.charter_func.chart.choose" />
      <a-select
        :key="update_flag + Math.random()"
        v-model="diff_index"
        :options="
          chart.diffs.map((v, i) => {
            return { display: v.name, val: i }
          })
        "
      />
      <label>{{ toTimeStr(current_ms / 1000) }}/{{ toTimeStr(chart.length / 1000) }}</label>
      <a-range v-model="writable_current_second" :max="chart.length / 1000" min="0" step="0.1" />
      <label v-html="Language.charter_func.chart.rate + ':' + play_rate + 'x'" />
      <a-range v-model="writable_play_rate" max="2" min="0.5" step="0.1" />
      <label v-html="Language.charter_func.volume + ':' + volume" />
      <a-range v-model.number="volume" max="100" min="0" />
    </div>
    <div class="chart-other">
      <div
        class="add-diff-btn"
        @click="chart.create_diff()"
        v-html="Language.charter_func.chart.create"
      />
      <div
        class="add-diff-btn"
        @click="chart.create_diff()"
        v-html="Language.charter_func.chart.del"
      ></div>
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
