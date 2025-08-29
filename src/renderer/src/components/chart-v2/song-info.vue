<script setup lang="ts">
import { Charter } from '@renderer/core/charter'
import SongInfoSingle from '@renderer/components/chart-v2/song-info-single.vue'
import ASelect from '@renderer/components/a-elements/a-select.vue'
import { ref } from 'vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'

const chart = Charter.get_chart()

const refs = chart.song.refs
const need = chart.song.need_roman

const bound = chart.diff.bound
const options = () =>
  chart.diffs.map((x, v) => {
    return { val: v, display: x.meta.diff1 + ' - ' + x.meta.diff2 }
  })
const dix = chart.ref.diff_index
const src = `stray:///__sprite__/${chart.id}`
const src2 = `stray:///__bg__/${chart.id}`
const img_show = ref(true)
const img2_show = ref(true)

function add_diff() {
  chart.create_diff()
}
function delete_diff() {
  chart.delete_diff()
}

function import_sprite() {
  Charter.invoke("import-sprite", chart.id)
}
function import_bg() {
  Charter.invoke("import-background", chart.id)
}

</script>

<template>
  <div class="info-wrapper">
    <div class="info-inner">
      <song-info-single name="曲名" v-model="refs.name" />
      <song-info-single :disabled="!need[0]" name="曲名-罗马音" v-model="refs.name_roman" />
      <song-info-single name="编曲" v-model="refs.composer" />
      <song-info-single :disabled="!need[1]" name="编曲-罗马音" v-model="refs.composer_roman" />
      <song-info-single name="画师" v-model="refs.sprite" />
      <song-info-single name="BPM" v-model.trim="refs.bpm" />
      <song-info-single name="来源" v-model="refs.source" />
      <song-info-single name="注释" v-model="refs.ref" />
      <div class="song-info-single">
        <div>曲绘<a-button2 msg="导入曲绘" @click="import_sprite"/></div>
        <img
          class="song-sprite"
          alt="how are you reading this?"
          :src="src"
          @error="img_show = false"
          v-if="img_show"
        />
      </div>
      <div class="song-info-single" >
        <div>背景<a-button2 msg="导入背景" @click="import_bg"/></div>
        <img
          class="song-sprite"
          alt="how are you reading this?"
          :src="src2"
          @error="img2_show = false"
          v-if="img2_show"
        />

      </div>
    </div>
    <div class="info-inner">
      <div class="song-info-single diff-choose">
        <div>
          <div>选择难度：</div>
          <a-select :options="options()" v-model="dix" :key="JSON.stringify(bound.meta)"></a-select>
        </div>
        <div>
          <a-button2 @click="add_diff" msg="新建难度" />
          <a-button2 @click="delete_diff" msg="删除该难度" />
        </div>
      </div>
      <song-info-single name="难度" v-model="bound.meta.diff1" />
      <song-info-single name="等级" v-model="bound.meta.diff2" />
      <song-info-single name="谱师" v-model="bound.meta.charter" />
    </div>
  </div>
</template>

<style scoped>
.info-wrapper {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  box-sizing: border-box;
  border: 50px solid transparent;
}
.song-sprite {
  left: 50%;
  position: relative;
  transform: translateX(-50%);
  height: 15vh;
  background: white;
  padding: 5px;
}
.info-inner {
  display: flex;
  flex-direction: column;
  padding: 15px;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
}
.song-info-single {
  position: relative;
  border-radius: 10px;
  padding: 15px;
  background: var(--darker-bgi);
}
.song-info-single:last-child {
  margin-bottom: 10vh;
}
.song-info-single > div:first-child {
  display: flex;
  justify-content: space-between;
}
.diff-choose {
  display: flex;
  flex-direction: column;
  gap: 10px 0;
  align-items: center;
}
.diff-choose > div {
  flex-direction: row;
  display: flex;
  gap: 25px;
}
</style>
