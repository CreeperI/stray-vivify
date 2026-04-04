<script lang="ts" setup>
import SmallDiffChoice from '@renderer/components/chart-v2/chart-tabs/small/small-diff-choice.vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import ASelect from '@renderer/components/a-elements/a-select.vue'
import { Chart } from '@renderer/core/chart/chart'
import { onUnmounted, ref, watch } from 'vue'
import { VSM_OBJECTS } from '@renderer/core/chart/vsm-objects'
import { Storage } from '@renderer/core/storage'
import { RefreshAll } from '@renderer/core/misc/refresh-all'

const chart = Chart.$current
const vsm = chart.vsm

const vsm_index = vsm.refs.vsm_index
const { obj } = vsm.refs

const __name = ref(vsm.vsm.name)
const { stop } = watch(vsm.refs.obj, (newV) => {
  __name.value = newV.name
})
onUnmounted(() => stop())

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
const rKey = RefreshAll.generate_key('vsm-choice')
</script>

<template>
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
.vsm-obj {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: center;
  gap: 5px;
  justify-items: center;
}
</style>
