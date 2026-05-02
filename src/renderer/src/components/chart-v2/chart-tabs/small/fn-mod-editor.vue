<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { computed, onUnmounted, ref, watch } from 'vue'
import { utils } from '@renderer/core/utils'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import ASelect from '@renderer/components/a-elements/a-select.vue'
import { PROXY_REQUIREMENT, VSM_EASING } from '@renderer/core/chart/vsm-objects'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'

import { ChartTypeV2 } from '@preload/chart-types'

const chart = Chart.$current
const vsm = chart.vsm
const obj = vsm.refs.obj
const diff = chart.diff
const mod_index = vsm.refs.mod_index
const the = ref<ChartTypeV2.mod>({
  duration: 0,
  easing: 'linear',
  modname: 'scrollspeed',
  proxy: 0,
  repeat: 0,
  step: 0,
  time: 0,
  value1: 0,
  value2: 0
})
const beat_length = ref(60000 / diff.bpm_of_time(chart.audio.current_time).bpm)

const { stop: stopwatchIdx } = watch(mod_index, (newV) => {
  const r = vsm.vsm.mods[newV]
  if (r) {
    the.value = r
    beat_length.value = 60000 / diff.bpm_of_time(r.time).bpm
  } else {
    beat_length.value = 60000 / diff.bpm_of_time(chart.audio.current_time).bpm
  }
})
const { stop: stopwatchThe } = watch(
  the,
  (newV) => {
    const r = vsm.vsm.mods[mod_index.value]
    if (newV) {
      utils.less_assign(r, newV)
      proxy_require.value = PROXY_REQUIREMENT(newV.modname)
      if (proxy_require.value != 1) {
        the.value.proxy = proxy_require.value
      }
    }
  },
  { deep: true }
)

onUnmounted(() => {
  stopwatchIdx()
  stopwatchThe()
})
const proxy_require = ref(114514)
const able_mods = vsm.refs.sorted_able_mods
const repeat_classes = computed(() => {
  if (the.value) return the.value.repeat ? '' : 'no-repeat'
  return ''
})
</script>

<template>
  <div :key="mod_index" class="fn-mod-editor">
    <template v-if="mod_index > -1">
      <div class="mod-header">Mod #{{ mod_index }}</div>
      <div>Time</div>
      <div>
        {{ utils.toTimeStr(the.time / 1000) }}
        <span class="time-span">/ {{ diff.get_beat_string(the.time) }}</span>
      </div>
      <div>Duration</div>
      <a-number-input :key="mod_index" v-model="the.duration" min="0" />
      <div>value1</div>
      <a-text-input v-model="the.value1" />
      <div>value2</div>
      <a-text-input v-model="the.value2" />
      <template v-if="proxy_require == 1">
        <div>Proxy</div>
        <a-number-input v-model="the.proxy" :max="obj.proxies" />
      </template>
      <template v-else>
        <div class="no-repeat">Proxy</div>
        <word-helper dec="该mod限制了proxy">
          <a-number-input v-model="the.proxy" disabled style="max-width: 3rem" />
        </word-helper>
      </template>

      <div :class="repeat_classes">Repeat</div>
      <a-number-input v-model="the.repeat" min="0" />
      <div :class="repeat_classes">Step</div>
      <a-number-input v-model="the.step" min="0" />
      <div>Easing</div>
      <a-select v-model="the.easing" :options="VSM_EASING" maxh="10rem" />
      <div>modname</div>
      <a-select v-model="the.modname" :options="able_mods" maxh="10rem" />
      <word-helper dec="直接编辑mod名称，如果你不想在上面找的话">modname</word-helper>
      <a-text-input v-model="the.modname" />
      <div style="grid-column: span 2; height: 15px" />
    </template>
    <div style="grid-column: span 2">时值参考</div>
    <div class="beat-lengths">
      <div>4'</div>
      <div>{{ beat_length.toFixed(1) }}ms</div>
      <div>8'</div>
      <div>{{ (beat_length / 2).toFixed(1) }}ms</div>
      <div>12'</div>
      <div>{{ (beat_length / 3).toFixed(1) }}ms</div>
      <div>16'</div>
      <div>{{ (beat_length / 4).toFixed(1) }}ms</div>
      <div>24'</div>
      <div>{{ (beat_length / 6).toFixed(1) }}ms</div>
      <div>32'</div>
      <div>{{ (beat_length / 8).toFixed(1) }}ms</div>
    </div>
  </div>
</template>

<style scoped>
.fn-mod-editor {
  display: grid;
  grid-template-columns: 2fr 3fr;
  justify-items: center;
  gap: 5px;
}
.mod-header {
  grid-column: 1 / span 2;
}
.time-span {
  color: gray;
  font-size: 90%;
}
.no-repeat {
  opacity: 0.4;
}
.beat-lengths {
  grid-column: span 2;
  grid-template-columns: repeat(4, 1fr);
  width: 100%;
  display: grid;
  justify-items: center;
}
</style>
