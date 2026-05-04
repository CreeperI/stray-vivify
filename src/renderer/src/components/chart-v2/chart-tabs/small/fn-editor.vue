<script lang="ts" setup>
import { computed } from 'vue'
import { Storage } from '@renderer/core/storage'
import ARange from '@renderer/components/a-elements/a-range.vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import { EventHub } from '@renderer/core/misc/eventhub'

const scale = computed({
  get() {
    return Storage.settings.scale
  },
  set(v) {
    Storage.settings.scale = v
  }
})
const meter = computed({
  get() {
    return Storage.settings.meter
  },
  set(v) {
    Storage.settings.meter = v
  }
})
</script>
<template>
  <table class="table-set">
    <tbody>
      <tr>
        <td style="width: 10%">流速</td>
        <td colspan="9">
          <a-range
            v-model="scale"
            :max="Storage.settings.max_scale"
            :min="0.1"
            :step="0.1"
            style="width: 100%"
            @update:model-value="EventHub.dispatch('scale-changed')"
          />
        </td>
        <td style="width: 15%">
          <a-number-input v-model="scale" :max="Storage.settings.max_scale" min="0.1" step="0.1" />
        </td>
      </tr>
      <tr>
        <td rowspan="2">分音</td>
        <td colspan="9">
          <a-range
            v-model="meter"
            :max="Storage.settings.max_meter"
            min="1"
            step="1"
            style="width: 100%"
            @update:model-value="EventHub.dispatch('meter-changed')"
          />
        </td>
        <td>
          <a-number-input v-model="meter" :max="Storage.settings.max_meter" min="1" step="1" />
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
</style>
