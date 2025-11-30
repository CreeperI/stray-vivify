<script lang="ts" setup>
import { computed } from 'vue'
import { Settings } from '@renderer/core/settings'
import ARange from '@renderer/components/a-elements/a-range.vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'

const scale = computed({
  get() {
    return Settings.editor.scale
  },
  set(v) {
    Settings.editor.scale = v
  }
})
const meter = computed({
  get() {
    return Settings.editor.meter
  },
  set(v) {
    Settings.editor.meter = v
  }
})
</script>
<template>
  <table class="table-set">
    <tbody>
      <tr>
        <td style="width: 10%">流速</td>
        <td colspan="9">
          <a-range v-model="scale" :max="20" :min="0.1" :step="0.1" style="width: 100%" />
        </td>
        <td style="width: 15%">
          <a-number-input v-model="scale" max="20" min="0.1" step="0.1" />
        </td>
      </tr>
      <tr>
        <td rowspan="2">分音</td>
        <td colspan="9">
          <a-range v-model="meter" max="64" min="1" step="1" style="width: 100%" />
        </td>
        <td>
          <a-number-input v-model="meter" max="64" min="1" step="1" />
        </td>
      </tr>
      <tr>
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
    </tbody>
  </table>
</template>
<style scoped>
.table-set {
  height: min-content;
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

.fn-right-inner > input {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
  border-bottom: 1px solid transparent;
}

.fn-right-inner > input:focus {
  border-bottom: 1px solid var(--grey);
}

.fn-right-debugger > div {
  width: 100%;
}

.fn-right-debugger > div:nth-child(2n + 1) {
  text-align: right;
}
</style>
