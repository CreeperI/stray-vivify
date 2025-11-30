<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import ATab from '@renderer/components/a-elements/a-tab.vue'
import { computed, ref } from 'vue'
import { Chart } from '@renderer/core/chart/chart'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import AButton from '@renderer/components/a-elements/a-button.vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import CustomArtistList from '@renderer/components/modals/custom-artist-list.vue'
import { utils } from '@renderer/core/utils'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import { Chart_diff } from '@renderer/core/chart/diff'
import { Invoke } from '@renderer/core/ipc'
import { modal } from '@renderer/core/modal'
import 'vue-json-pretty/lib/styles.css'
import VueJsonPretty from 'vue-json-pretty'
import { Settings } from '@renderer/core/settings'

const chart = Chart.$current

const STR = ['Opening', 'Middle', 'Finale', 'Encore']

const phase = ref(0)

const diff_indexs = ref([-1, -1, -1, -1])
const can_pass_1 = computed(() => diff_indexs.value.some((x) => x != -1))

function drop(ix: number) {
  return function (e: DragEvent) {
    if (!e.dataTransfer) return
    const index = e.dataTransfer.getData('index')
    if (!index) return
    const num = parseInt(index)
    if (num < 0 || num > 3 || isNaN(num)) return
    diff_indexs.value[ix] = num
  }
}
function fuck_diff(ix: number) {
  diff_indexs.value[ix] = -1
}

function start_diff_drag(ix: number) {
  return function (e: DragEvent) {
    if (!e.dataTransfer) return
    e.dataTransfer?.setData('index', ix.toString())
    e.dataTransfer.dropEffect = 'move'
  }
}

// ----------- Phase 1: Info
function possible_difficulty(ix: number) {
  if (!isNaN(parseFloat(chart.diffs[ix].meta.diff1))) return parseFloat(chart.diffs[ix].meta.diff1)
  else if (!isNaN(parseFloat(chart.diffs[ix].meta.diff2)))
    return parseFloat(chart.diffs[ix].meta.diff2)
  else return 0
}
function filter_STR() {
  const fl: number[] = []
  for (let i = 0; i < 4; i++) {
    if (diff_indexs.value[i] == -1) continue
    fl.push(i)
  }
  return fl
}
function start_phase_1() {
  if (!can_pass_1.value) return
  info_data.value = {
    ...info_data.value,
    chart_id: chart.id,
    name: chart.song.name,
    formatted_name: chart.song.name_roman,
    artist: chart.song.composer,
    sort_artists: [chart.song.composer],
    bpm_display: chart.song.bpm,
    has_encore: diff_indexs.value[3] != -1
  }
  for (let i = 0; i < 4; i++) {
    if (diff_indexs.value[i] == -1) continue
    const the_index = diff_indexs.value[i]
    info_data.value[`difficulty_constant_${i + 1}`] = possible_difficulty(the_index)
    info_data.value[`note_designer_${i + 1}`] = chart.diffs[the_index].meta.charter
    info_data.value[`difficulty_display_${i + 1}`] = possible_difficulty(the_index).toString()
  }
  phase.value = 1
}
const is_backstage = ref(false)
const info_data = ref({
  chart_id: '',
  name: '',
  formatted_name: '',
  artist: '',
  sort_artists: <string[]>[],
  bpm_display: '120',
  version: '9.9.9',
  is_original: false,
  is_published: true,
  jacket_artist: '',
  has_encore: false,
  difficulty_constant_1: 0,
  difficulty_display_1: '0',
  note_designer_1: 'N/A',
  difficulty_constant_2: 0,
  difficulty_display_2: '0',
  note_designer_2: 'N/A',
  difficulty_constant_3: 0,
  difficulty_display_3: '0',
  note_designer_3: 'N/A',
  difficulty_constant_4: 0,
  difficulty_display_4: '0',
  note_designer_4: '',
  unlock: {
    type: 0,
    enc_type: 0,
    per_difficulty: false,
    hidden: false,
    hint: '',
    enc_hint: ''
  },
  enc_data: {
    audio_id: '',
    preview_id: '',
    jacket: '',
    bpm_display: chart.song.bpm,
    name: chart.song.name,
    formatted_name: chart.song.name_roman,
    artist: chart.song.composer,
    jacket_designer: 'N/A'
  }
})
// -------------- Phase 2
function start_phase_2() {
  if (diff_indexs.value[3] == -1) {
    // @ts-expect-error
    delete info_data.value.enc_data
  }
  if (diff_indexs.value[3] != -1) {
    for (const _i of utils.keyof(info_data.value['enc_data'])) {
      if (info_data.value['enc_data'][_i] == '') delete info_data.value['enc_data'][_i]
    }
  }
  phase.value = 2
}
const args = ref({
  crop: Settings.editor.exporter.crop,
  as_id: chart.id,
  sv: Settings.editor.exporter.sv
})
function do_export() {
  const gml = info_data.value
  if (!gml) return
  const diffs = filter_STR().map((ix) =>
    Chart_diff.to_vsc(chart.diffs[diff_indexs.value[ix]]).join('\n')
  )
  const _arg = {
    crop: args.value.crop,
    as_id: args.value.as_id == '' ? undefined : args.value.as_id,
    sv: args.value.sv,
    diffs: diffs,
    gml: JSON.stringify(gml),
    id: chart.id
  }
  chart
    .save()
    .then(() => Invoke('export-for-custom', _arg))
    .then(() => {
      modal.close_all()
    })
}
</script>

<template>
  <SimpleModal size="3" title="gugu gaga">
    <div class="custom-wrapper">
      <a-tab v-model="phase">
        <div disabled="true">选择diff</div>
        <div disabled="true">填数据</div>
        <div disabled="true">最后修改</div>
      </a-tab>
      <div class="custom-inner">
        <div v-if="phase == 0" class="custom-diff">
          <div class="diff-left">
            <span class="grid-2-header">
              <word-helper dec="点击下面方框以删除选择，可以覆盖" msg="从右侧拖动diff！" />
            </span>
            <template v-for="(ix, i) in STR">
              <div>{{ ix }}</div>
              <div @click="fuck_diff(i)" @drop="drop(i)($event)" @dragover.prevent>
                {{
                  diff_indexs[i] == -1
                    ? ''
                    : `${chart.diffs[diff_indexs[i]].meta.diff1} - ${chart.diffs[diff_indexs[i]].meta.diff2}`
                }}
              </div>
            </template>
            <a-button
              v-if="can_pass_1"
              msg="Next"
              style="grid-column: span 2; width: 6rem"
              @click="start_phase_1"
            />
          </div>
          <div class="diff-right">
            <div
              v-for="(diff, ix) in chart.chart.diffs"
              class="diff-single"
              draggable="true"
              @dragstart="start_diff_drag(ix)($event)"
            >
              <div>{{ diff.meta.diff1 }} - {{ diff.meta.diff2 }}</div>
              <div>Charter: {{ diff.meta.charter }}</div>
              <div>Notes: {{ diff.notes.length }}</div>
            </div>
          </div>
        </div>
        <div v-if="phase == 1" class="custom-json">
          <div class="json-info">
            <div class="grid-2-header">曲目信息</div>
            <div>ID</div>
            <a-text-input v-model="info_data.chart_id" />
            <div>名称</div>
            <a-text-input v-model="info_data.name" />
            <div>格式化名称</div>
            <a-text-input v-model="info_data.formatted_name" />
            <div>曲师</div>
            <a-text-input v-model="info_data.artist" />
            <custom-artist-list v-model="info_data.sort_artists" />
            <div>BPM</div>
            <a-text-input v-model="info_data.bpm_display" />
            <div>画师</div>
            <a-text-input v-model="info_data.jacket_artist" placeholder="请输入文本" />
            <a-button msg="Next" style="grid-column: span 2; width: 6rem" @click="start_phase_2" />
          </div>
          <div class="json-per-diff">
            <div class="grid-2-header">难度信息</div>
            <template v-for="ix in filter_STR()">
              <div class="grid-2-header">{{ STR[ix] }}</div>
              <div>定数</div>
              <a-number-input
                v-model="info_data[`difficulty_constant_${ix + 1}`]"
                min="0"
                step="0.1"
              />
              <div>定数显示</div>
              <a-text-input v-model="info_data[`difficulty_display_${ix + 1}`]" />
              <div>Charter</div>
              <a-text-input v-model="info_data[`note_designer_${ix + 1}`]" />
            </template>
            <template v-if="diff_indexs[3] != -1">
              <div>Backstage?</div>
              <a-checkbox v-model="is_backstage" />
              <template v-if="is_backstage">
                <div>音频 id</div>
                <a-text-input v-model="info_data.enc_data.audio_id" placeholder="音频文件名" />
                <div>预览 id</div>
                <a-text-input v-model="info_data.enc_data.preview_id" placeholder="预览文件名" />
                <div>曲绘 id</div>
                <a-text-input v-model="info_data.enc_data.jacket" placeholder="曲绘文件名" />

                <div>曲名</div>
                <a-text-input v-model="info_data.enc_data.name" />
                <div>格式化名称</div>
                <a-text-input v-model="info_data.enc_data.formatted_name" />
                <div>曲师</div>
                <a-text-input v-model="info_data.enc_data.artist" />
                <div>BPM</div>
                <a-text-input v-model="info_data.enc_data.bpm_display" />
                <div>画师</div>
                <a-text-input v-model="info_data.enc_data.jacket_designer" />
              </template>
            </template>
          </div>
        </div>
        <div v-if="phase == 2" class="custom-final">
          <div class="final-functions">
            <WordHelper dec="指定导出文件夹的命名，若不给定则使用内置默认命名" msg="文件夹名" />
            <a-text-input v-model="args.as_id" />
            <WordHelper dec="是否裁剪图片，勾选则会剪切中间的正方形，不勾选则拉伸" msg="裁剪" />
            <a-checkbox v-model="args.crop" />
            <WordHelper
              dec="是否在导出中包含stray/vivify的数据文件（不*应该*影响customsong的读取）"
              msg="SV"
            />
            <a-checkbox v-model="args.sv" />
            <a-button class="export-btn" msg="Export" @click="do_export" />
          </div>
          <div class="final-textarea">
            <VueJsonPretty :data="info_data" :editable="true" />
          </div>
        </div>
      </div>
    </div>
  </SimpleModal>
</template>

<style scoped>
.custom-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 60vh;
  max-height: 70vh;
}
.custom-inner {
  width: 100%;
  height: 60vh;
}
.custom-diff {
  width: 100%;
  display: grid;
  grid-template-columns: 3fr 2fr;
}
.diff-left {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: center;
  justify-items: center;
  text-align: center;
  row-gap: 25px;
  margin-top: 50px;
  padding-left: 25px;
}
.grid-2-header {
  grid-column: 1 / span 2;
  padding-bottom: 15px;
  font-weight: bold;
}
.diff-left div:nth-child(2n + 1) {
  border: #b8dcee 2px solid;
  width: 15rem;
  height: 3rem;
  line-height: 3rem;
}
.diff-single {
  width: 100%;
  height: min-content;
  display: grid;
  grid-template-areas: 'a a a' 'b c c';
  border: 1px solid #b8dcee;
  padding: 5px;
}
.diff-single :nth-child(1) {
  grid-area: a;
}
.diff-single :nth-child(2) {
  grid-area: b;
  font-size: 0.9rem;
}
.diff-single :nth-child(3) {
  grid-area: c;
  font-size: 0.8rem;
  opacity: 0.8;
}
.custom-json {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
}
.json-info,
.json-per-diff {
  display: grid;
  grid-template-columns: 1fr 2fr;
  justify-items: center;
  height: min-content;
  gap: 5px;
}
.custom-final {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  width: 100%;
  height: 100%;
}
.final-functions {
  display: grid;
  grid-template-columns: 5rem 1fr;
  justify-items: center;
  width: min-content;
  padding: 10px;
  height: min-content;
}
.final-textarea {
  flex-grow: 1;
  font-size: 1rem;
  height: 100%;
  overflow-y: auto;
  min-height: 0;
}
.export-btn {
  grid-column: span 2;
  text-align: center;
  margin-top: 15px;
}
:deep(input) {
  color: #b8dcee;
  background: transparent;
}
</style>
<style>
.vjs-tree-node:hover {
  background-color: #cccccc66 !important;
}
</style>
