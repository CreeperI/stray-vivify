<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { ChartTypeV2 } from '@preload/types'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Chart } from '@renderer/core/chart/chart'
import { ref } from 'vue'
import Hide from '@renderer/components/a-elements/hide.vue'
import { utils } from '@renderer/core/utils'

defineProps<{
  diff?: ChartTypeV2.diff[]
  song?: ChartTypeV2.song
}>()

const chart = Chart.$current
const imported = ref<number[]>([])
function import_diff(d: ChartTypeV2.diff, ix: number) {
  chart.add_diff(d)
  imported.value.push(ix)
}

const show_song = ref(false)
function load_song(s: ChartTypeV2.song) {
  utils.less_assign(chart.song, s)
  show_song.value = true
  chart.set_header_name()
}
</script>

<template>
  <simple-modal size="3" title="importing osz">
    <div class="wrapper">
      <Hide title="谱面">
        <div v-if="diff" class="osz-diffs">
          <div v-for="(d, ix) in diff" class="osz-diff-line">
            <div>{{ d.meta.diff1 }}</div>
            <div>by {{ d.meta.charter }}</div>
            <a-button2 v-if="imported.includes(ix)" disabled msg="已导入！" />
            <a-button2 v-else msg="导入" @click="import_diff(d, ix)" />
          </div>
        </div>
      </Hide>
      <Hide title="歌曲">
        <div v-if="song" class="osz-song">
          <div>{{ song.name }}</div>
          <div>{{ song.composer }}</div>
          <a-button2 v-if="show_song" disabled msg="已导入" @click="load_song(song)"></a-button2>
          <a-button2 v-else msg="导入" @click="load_song(song)"></a-button2>
        </div>
      </Hide>
    </div>
  </simple-modal>
</template>

<style scoped>
.wrapper {
  width: 100%;
  max-height: 50vh;
  overflow: hidden scroll;
}
.osz-diffs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.osz-diff-line {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr;
  text-align: center;
}
.osz-diff-line > :first-child {
  word-break: keep-all;
}
.osz-song {
  display: flex;
  justify-content: space-evenly;
}
</style>
