<script setup lang="ts">
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
  chart.diffs.push(d)
  chart.save()
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
  <simple-modal size="lg" title="importing osz">
    <div class="wrapper">
      <Hide title="谱面">

      <div class="osz-diffs" v-if="diff">
        <div class="osz-diff-line" v-for="(d, ix) in diff">
          <div>{{ d.meta.diff1 }}</div>
          <div>by {{ d.meta.charter }}</div>
          <div></div>
          <a-button2 msg="已导入！" disabled v-if="imported.includes(ix)" />
          <a-button2 msg="导入" v-else @click="import_diff(d, ix)" />
        </div>
      </div>
      </Hide>
      <Hide title="歌曲">
        <div class="osz-song" v-if="song">
          <div>{{song.name}}</div>
          <div>{{song.composer}}</div>
          <a-button2 msg="已导入" disabled @click="load_song(song)" v-if="show_song"></a-button2>
          <a-button2 msg="导入" @click="load_song(song)" v-else></a-button2>
        </div>
      </Hide>
    </div>
  </simple-modal>
</template>

<style scoped>
.wrapper {
  width: 100%;
  max-height: 50vh;
  overflow: scroll;
}
.osz-diffs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.osz-diff-line {
  display: grid;
  grid-template-columns: 1fr 1fr 3fr 1fr;
  text-align: center;
}
.osz-song {
  display: flex;
  justify-content: space-evenly;
}
</style>
