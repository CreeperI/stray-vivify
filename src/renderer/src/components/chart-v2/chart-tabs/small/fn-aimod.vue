<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { utils } from '@renderer/core/utils'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Storage } from '@renderer/core/storage'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'

const chart = Chart.$current
const aimod = chart.diff.ai_mod
function update() {
  chart.diff.check_aimod()
}
function seek(t: number) {
  chart.audio.set_current_time(t - Storage.computes.visible.value / 3)
}
</script>

<template>
  <div class="ai-mod-wrapper">
    <div @click="update()"><word-helper dec="点击以刷新" msg="aiMod" /></div>
    <div v-if="aimod.length > 0" class="ai-mod">
      <div>时间</div>
      <div>内容</div>
      <div class="ai-mod-sep" />
      <template v-for="s in aimod">
        <div class="click" @click="seek(s[0])">{{ utils.toTimeStr(s[0] / 1000) }}</div>
        <div>{{ s[1] }}</div>
      </template>
    </div>
    <div v-else class="no-problem">No problem</div>
    <div v-if="!Storage.settings.auto_save" class="save">
      自动保存已关闭。
      <a-button2 msg="保存" @click="chart.save(true)" />
    </div>
  </div>
</template>

<style scoped>
.ai-mod-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ai-mod {
  width: 90%;
  max-height: 35vh;
  overflow-y: auto;
  display: grid;
  grid-template-columns: auto 3fr;
  gap: 0 10px;
}
.ai-mod-sep {
  grid-column: span 2;
  border-top: 1px solid #b8dcee;
  width: 100%;
}
.click {
  cursor: pointer;
}
.no-problem {
  color: gray;
  padding: 15px;
}
.save {
  display: flex;
  flex-direction: row;
}
</style>
