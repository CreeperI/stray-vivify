<script lang="ts" setup>
import ASelect from '@renderer/components/a-elements/a-select.vue'
import { Chart } from '@renderer/core/chart/chart'
import { factory_strings } from '@renderer/core/chart/diff-sv'

const chart = Chart.$current
const sv_data = chart.diff.sv_bind.sv_data

const __select_options = factory_strings.map((x, ix) => {
  return {
    val: ix,
    display: x
  }
})
</script>

<template>
  <div class="fn-wrapper">
    <div class="sv-type">
      <span>SV类型</span>
      <div :data-is="!sv_data.is_factory" class="sv-btn" @click="sv_data.is_factory = false">变速</div>
      <div :data-is="sv_data.is_factory" class="sv-btn" @click="sv_data.is_factory = true">组</div>
      <div>SV组</div>
      <a-select v-model="sv_data.type" :options="__select_options" class="sv-select" />
    </div>
  </div>
</template>

<style scoped>
.sv-type {
  display: grid;
  grid-template-columns: minmax(3rem, 5rem) 3fr 3fr;
  justify-content: space-evenly;
  text-align: center;
  align-items: center;
  gap: 10px 5px;
}

.sv-btn {
  cursor: pointer;
  transition: background-color 0.2s;
  background: #ffffff11;
  padding: 5px 0;
  &:hover {
    background: #ffffff44;
  }
  &[data-is='true'] {
    background: #ffffff44;
  }
}
.sv-select {
  grid-column: span 2;
  justify-self: center;
  width: 70%;
  min-width: max-content;
  text-align: left;
}
</style>
