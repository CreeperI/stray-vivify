<script lang="ts" setup>
import ui from '@renderer/core/ui'
import { watch } from 'vue'
import Translations from '@renderer/core/translations'
import ARange from '@renderer/components/a-elements/a-range.vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'

const setting = ui.charter.settings
const { scale, meter } = setting
const Language = Translations

watch(scale, (v) => {
  if (isFinite(Number(v))) {
    v = Math.floor(v * 10) / 10
    scale.value = Math.min(Math.max(Number(v), 0.1), 20)
  } else scale.value = 7.5
})

watch(meter, (v) => {
  if (isFinite(Number(v))) {
    v = Math.floor(v)
    meter.value = Math.min(Math.max(Number(v), 1), 64)
  } else meter.value = 4
})

if (!ui.chart) throw new Error('')
</script>

<template>
  <div class="fp-unit">
    <div class="fp-title" v-html="Language.fp.charter" />
    <div class="mode-set">
      <div v-html="Language.fp.scale" />
      <a-range v-model="scale" :max="20" :min="0.1" :step="0.1" />
      <a-number-input v-model="scale" max="20" min="0.1" step="0.1" />
    </div>
    <div class="mode-set">
      <div v-html="Language.fp.meter" />
      <a-range v-model="meter" :max="64" :min="1" :step="1" />
      <a-number-input v-model="meter" max="64" min="1" step="1" />
    </div>
  </div>
</template>

<style scoped>
.mode-set {
  display: grid;
  padding: 5px;
  grid-template-columns: 1fr 3fr 1fr;
  text-align: center;
  justify-items: center;
  width: 100%;
}
</style>
