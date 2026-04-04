<script lang="ts" setup>
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import ASelect from '@renderer/components/a-elements/a-select.vue'
import { Chart } from '@renderer/core/chart/chart'
import { onUnmounted, ref, watch } from 'vue'
import { RefreshAll } from '@renderer/core/misc/refresh-all'

const chart = Chart.$current
const vsm = chart.vsm

const { obj, editor, all_proxy, mod, proxy } = vsm.refs
const able_mods = vsm.refs.sorted_able_mods
const rKey = RefreshAll.generate_key('vsm-mod')
function write_vsm() {
  chart.write_current_vsm(__name.value)
}
const __name = ref(vsm.vsm.name)
const { stop } = watch(vsm.refs.obj, (newV) => {
  __name.value = newV.name
})
onUnmounted(() => stop())
</script>

<template>
  <div class="vsm-mod">
    <div>vsm名</div>
    <a-text-input v-model="obj.name" style="width: 80%" />
    <div>选择Mod</div>
    <a-select :key="rKey" v-model="mod" :options="able_mods" maxh="15rem" style="width: 80%" />
    <div>mod重复</div>
    <div class="mod-repeat">
      <div :class="editor.do_repeat ? '' : 'chosen'" @click="editor.do_repeat = false">单次</div>
      <div :class="editor.do_repeat ? 'chosen' : ''" @click="editor.do_repeat = true">Repeat</div>
    </div>
    <div>查看Proxy</div>
    <div class="mod-repeat">
      <div :class="all_proxy ? 'chosen' : ''" @click="all_proxy = true">All</div>
      <a-number-input
        v-model="proxy"
        :class="all_proxy ? 'unchosen' : ''"
        :max="obj.proxies"
        :min="-1"
        @focus="all_proxy = false"
      />
    </div>
    <a-button2 msg="导出当前vsm" @click="write_vsm" />
    <word-helper dec="这是文件名，不用加后缀">
      <a-text-input v-model="__name" />
    </word-helper>
  </div>
</template>

<style scoped>
.vsm-mod {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: center;
  gap: 5px;
  justify-items: center;
}
.mod-repeat {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 5px;
  width: 80%;
  align-self: center;
}
.mod-repeat > div {
  box-shadow: 0 0 2px black;
  padding: 3px 5px;
  text-align: center;
  background: #2c2c2c;
  transition: all 0.1s linear;
  will-change: background-color;
}
.chosen:not(input) {
  background: #555 !important;
}
.unchosen {
  opacity: 0.3;
}
</style>
