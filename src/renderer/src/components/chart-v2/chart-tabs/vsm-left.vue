<script lang="ts" setup>
import ASelect from '@renderer/components/a-elements/a-select.vue'
import { Chart } from '@renderer/core/chart/chart'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { VSM_OBJECTS } from '@renderer/core/chart/vsm-objects'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import { utils } from '@renderer/core/utils'
import { Storage } from '@renderer/core/storage'
import SmallDiffChoice from '@renderer/components/chart-v2/chart-tabs/small/small-diff-choice.vue'
import FnModEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-mod-editor.vue'
import { onUnmounted, ref, watch } from 'vue'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'

const chart = Chart.$current
const vsm = chart.vsm

const vsm_index = vsm.refs.vsm_index
const { obj, editor, all_proxy, mod, proxy } = vsm.refs

const __name = ref(vsm.vsm.name)
const { stop } = watch(vsm.refs.obj, (newV) => {
  __name.value = newV.name
})
onUnmounted(() => stop())
function write_vsm() {
  chart.write_current_vsm(__name.value)
}

const vsm_options = () => {
  return vsm.data.map((v, ix) => {
    return {
      val: ix,
      display: v.name
    }
  })
}

const obj_options = VSM_OBJECTS.map((x) => {
  if (Storage.settings.sv.short_obj) {
    return {
      val: x,
      display: x.replace(/^obj_(.+?)_gimmick(?:_(.*))?$/, (_, a, b) =>
        [a, b].filter(Boolean).join('_')
      )
    }
  }
  return {
    val: x,
    display: x
  }
})

const able_mods = vsm.refs.sorted_able_mods
const rKey = utils.refresh_key
</script>

<template>
  <div class="fn-wrapper">
    <div class="vsm-info">
      <small-diff-choice />
      <div class="vsm-even" style="margin-top: 10px">
        <div>选择vsm</div>
        <a-select :key="rKey" v-model="vsm_index" :options="vsm_options()" />
      </div>
      <div class="vsm-even">
        <a-button2 v-if="vsm.data.length == 1" msg="清空" @click="vsm.del_vsm()" />
        <a-button2 v-else msg="删除" @click="vsm.del_vsm()" />
        <a-button2 msg="复制" @click="vsm.copy_vsm()" />
        <a-button2 msg="新建" @click="vsm.new_vsm()" />
      </div>
      <div class="vsm-obj">
        <div>选择obj</div>
        <a-select v-model="obj.obj" :options="obj_options" maxh="15rem" style="width: 80%" />
        <div>Proxies</div>
        <a-number-input v-model="obj.proxies" min="0" step="1" />
      </div>
    </div>
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
    <fn-mod-editor />
  </div>
</template>

<style scoped>
.vsm-info {
  display: flex;
  flex-direction: column;
}
.vsm-even {
  display: flex;
  justify-content: space-evenly;
  gap: 15px 5px;
}
.vsm-even .a-button2 {
  margin-top: 10px;
  max-width: 5rem;
  flex-grow: 1;
}
.vsm-obj,
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
