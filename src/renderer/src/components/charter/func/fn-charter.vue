<script lang="ts" setup>
import { watch } from 'vue'
import Translations from '@renderer/core/translations'
import ARange from '@renderer/components/a-elements/a-range.vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'

import { Charter } from '@renderer/core/charter'
import AButton from '@renderer/components/a-elements/a-button.vue'

const setting = Charter.settings.to_refs
const { scale, meter } = setting
const Language = Translations

const chart = Charter.get_chart()
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

if (!Charter.if_current()) throw new Error('')
</script>

<template>
  <div class="fp-unit">
    <div class="fp-title" v-html="Language.charter_func.charter" />
    <table class="table-set">
      <tbody>
        <tr>
          <td v-html="Language.charter_func.scale" style="width: 10%  ;" />
          <td colspan="9">
            <a-range style="width: 100%;" v-model="scale" :max="20" :min="0.1" :step="0.1" />
          </td>
          <td style="width: 15% ;">
            <a-number-input v-model="scale" max="20" min="0.1" step="0.1" />
          </td>
        </tr>
        <tr>
          <td v-html="Language.charter_func.meter" />
          <td colspan="9">
            <a-range style="width: 100%;" v-model="meter" :max="64" :min="1" :step="1" />
          </td>
          <td>
            <a-number-input v-model="meter" max="64" min="1" step="1" />
          </td>
        </tr>
        <tr>
          <td />
          <td class="meter-button" @click="meter = 4">4</td>
          <td class="meter-button" @click="meter = 6">6</td>
          <td class="meter-button" @click="meter = 8">8</td>
          <td class="meter-button" @click="meter = 12">12</td>
          <td class="meter-button" @click="meter = 16">16</td>
          <td class="meter-button" @click="meter = 24">24</td>
          <td class="meter-button" @click="meter = 32">32</td>
          <td class="meter-button" @click="meter = 48">48</td>
          <td class="meter-button" @click="meter = 64">64</td>
        </tr>
      <tr>
        <td colspan="5"><a-button :msg="Language.charter_func.undo" @click="chart.diff.execute_undo()" class="do-btn"/></td>
        <td colspan="5"><a-button :msg="Language.charter_func.redo" @click="chart.diff.execute_redo()" class="do-btn"/></td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.do-btn {
  min-width: 60%;
  height: 1.6rem;
  line-height: 1.6rem;
}
.table-set {
  width: 100%;
}
input {
  width: 100%;
}
td {
  text-align: center;
}
.meter-button {
  text-align: center;
  cursor: pointer;
  width: calc(75% / 9);
  box-sizing: content-box;
  border: 4px solid transparent;
  transition: 0.2s linear background-color;
}
.meter-button:hover {
  background: #444;
}
</style>
