<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { ref, watch } from 'vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Invoke } from '@renderer/core/ipc'
import Hide from '@renderer/components/a-elements/hide.vue'
import { notify } from '@renderer/core/notify'
import { modal } from '@renderer/core/modal'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import { utils } from '@renderer/core/utils'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'

const chart = Chart.$current
const gml = ref(`array_push(global.song_list,
{
    song_id: array_length(global.song_list),
    name: "${chart.song.name}",
    formatted_name: "${chart.song.name_roman}",
    artist: "${chart.song.composer}",
    chart_id: "${chart.id}",
    audio_id: music_chart_${chart.id},
    jacket: song_${chart.id},
    preview_id: preview_${chart.id},
    bpm_display: "${chart.diff.timing[0].bpm}",
    version: "9.9.9",
    has_encore: false,
    is_original: false,
    is_published: true,
    jacket_artist: "N/A",
    difficulty_constant_1: 0,
    difficulty_display_1: "0",
    note_designer_1: "N/A",
    difficulty_constant_2: 0,
    difficulty_display_2: "0",
    note_designer_2: "N/A",
    difficulty_constant_3: ${chart.diff.diff2.replace(/[^0-9]/g, '')},
    difficulty_display_3: "${chart.diff.diff2.replace(/[^0-9]/g, '')}",
    note_designer_3: "${chart.diff.charter}",
    difficulty_constant_4: 0,
    difficulty_display_4: "0",
    note_designer_4: "N/A",
    unlock:
    {
        song_id: array_length(global.song_list),
        type: 0,
        enc_type: 0,
        per_difficulty: false,
        hidden: false,
        hint: "",
        enc_hint: ""
    },
    is_custom: true
});`)

const the_id = ref(chart.id)
watch(the_id, (v1, v0) => {
  gml.value = gml.value.replaceAll(v0, v1)
})

function write_gml() {
  Invoke('write-file', chart.id, 'songinfo.gml', gml.value).then(() => {
    return Invoke('show-file', chart.id, 'songinfo.gml')
  })
}
const crop = ref(true)
async function write_custom_song() {
  await Invoke('create-folder', chart.id, 'customsong')
  const blob = await utils.makeSquareImage(
    `stray:/__sprite__/${chart.id}`,
    crop.value ? 'crop' : 'stretch'
  )
  await Invoke(
    'write-blob',
    chart.id,
    `customsong/song_${the_id.value}_0.png`,
    await utils.blobToBase64(blob)
  )
  await Invoke('write-file', chart.id, `customsong/FINALE.vsc`, chart.diff.to_vsc().join('\n'))
  await Invoke('write-file', chart.id, 'customsong/info.json', gml.value)
  Invoke('show-file', chart.id, `customsong/info.json`)
}

async function read_vsb() {
  const r1 = await Invoke('ask-vsb')
  if (!r1) {
    notify.error('读取vsb失败……')
    return
  }
  const chart = Chart.current as Chart
  chart.load_vsb(await Invoke('read-vsb', r1.path))
}

async function read_vsc() {
  const r1 = await Invoke('ask-file', ['vsc文件', 'vsc'])
  if (!r1) return notify.error('读取vsc失败……')
  const chart = Chart.$current
  const r2 = await Invoke('open-file-utf', r1)
  if (!r2) return notify.error('读取vsc失败……')

  chart.load_vsc(r2)
}

function write_vsc() {
  const chart = Chart.current
  if (!chart) throw new Error('?????')
  chart.write_current_vsc()
}
function export_svc() {
  Chart.$current.export_chart('svc')
}
function export_zip() {
  Chart.$current.export_chart('zip')
}

function import_osz() {
  Chart.$current.import_osz()
}

function import_osz_pics() {
  Chart.$current.import_osz_pics()
}
function open_svg() {
  modal.ChartPreviewModal.show({})
}

const sprite_err = chart.sprite_err
</script>

<template>
  <simple-modal size="sm" title="好多东西啊……">
    <div class="vsc-loader-wrapper">
      <Hide :def="true" title="导入/导出">
        <div class="iexports">
          <a-button2 msg="导入vsb" @click="read_vsb" />
          <a-button2 msg="导入vsc" @click="read_vsc" />
          <a-button2 msg="导入osz" @click="import_osz" />
          <a-button2 msg="导入osz的曲绘" @click="import_osz_pics" />
          <a-button2 msg="导出vsc" @click="write_vsc" />
          <a-button2 msg="导出svc" @click="export_svc" />
          <a-button2 msg="导出zip" @click="export_zip" />
          <a-button2 v-if="chart.diff.notes.length != 0" msg="导出svg" @click="open_svg" />
        </div>
      </Hide>
      <Hide title="gml">
        <div>修改下方的diff_constant_3来调整一个合适的定数，其它的帮你填好啦。</div>
        <div>注意准备的音乐需要和这个谱面是同一个id哦，或者你可以修改chart-id字段</div>
        <br />
        <label>
          填个id
          <a-text-input v-model="the_id" />
        </label>
        <textarea id="vsc-gml" v-model="gml" spellcheck="false" />
        <div class="gml-export">
          <a-button2 class="gml-btn" msg="导出gml" @click="write_gml" />
          <a-button2 v-if="!sprite_err" msg="customsong" @click="write_custom_song" />
          <label>
            <word-helper dec="勾选剪裁，不勾拉伸" msg="剪裁曲绘" />
            <a-checkbox v-model="crop" />
          </label>
        </div>
      </Hide>
    </div>
  </simple-modal>
</template>

<style scoped>
.vsc-loader-wrapper {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  max-height: 55vh;
  width: 100%;
  overflow-y: auto;
}
.iexports {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  width: 100%;
  justify-items: center;
  gap: 5px;
}
.vsc-loader-header {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
#vsc-gml {
  width: 100%;
  background: none;
  height: 45vh;
  font-size: 1.1rem;
  font-family: monospace;
  margin-top: 1.5rem;
}
#vsc-gml::spelling-error {
  text-decoration: none;
}
.gml-export {
  display: flex;
  justify-content: space-evenly;
  margin-top: 1rem;
  width: 100%;
}
</style>
