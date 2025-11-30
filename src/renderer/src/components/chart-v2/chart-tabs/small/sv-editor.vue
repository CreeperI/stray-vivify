<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { computed } from 'vue'
import ASelect from '@renderer/components/a-elements/a-select.vue'
import { factory_keys, factory_strings } from '@renderer/core/chart/diff-sv'
import { utils } from '@renderer/core/utils'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'

const chart = Chart.$current
const chart_sv = chart.diff.sv_bind

const sv_data = chart_sv.sv_data

const the_sv = computed(() => {
  return chart_sv.sv[sv_data.value.ix]
})
const timestr = computed(() => {
  return chart.diff.get_beat_string(the_sv.value.time)
})
const __select_options = factory_strings.map((x, ix) => {
  return {
    val: ix,
    display: x
  }
})
</script>

<template>
  <div class="sv-editor" v-if="sv_data.ix > -1">
    <div class="sv-editor-inner" style="margin-bottom: 15px">
      <div>#{{ sv_data.ix }}</div>
      <div>{{ the_sv.time }}ms - {{ timestr }}</div>
    </div>
    <div v-if="'type' in the_sv" class="sv-editor-inner">
      <div style="margin-bottom: 15px;">Type</div>
      <a-select v-model="the_sv.type" :options="__select_options" />
      <template v-for="k in utils.keyof(factory_keys[the_sv.type])">
        <div style="white-space: nowrap">{{ factory_keys[the_sv.type][k] }}</div>
        <a-number-input v-model="the_sv[k]" min="0" step="0.01" />
      </template>
    </div>
    <div v-else>
      <div>Effect</div>
      <a-number-input v-model="the_sv.eff" min="0" step="0.01" />
    </div>
  </div>
</template>

<style scoped>
.sv-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px;
  text-align: center;
}
.sv-editor > div {
  display: grid;
  grid-template-columns: 1fr 3fr;
  width: 90%;
}
</style>
