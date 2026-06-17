<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Invoke } from '@renderer/core/ipc'
import Hide from '@renderer/components/a-elements/hide.vue'
import { notify } from '@renderer/core/misc/notify'
import { modal } from '@renderer/core/misc/modal'
import IexporterGml from '@renderer/components/modals/iexporter-gml.vue'

const chart = Chart.$current

async function read_vsb() {
  const r1 = await Invoke('ask-file', { file: ['vsb文件', 'vsb'] })
  if (!r1) {
    return
  }
  const r2 = await Invoke('read-vsb', { fp: r1 })
  if (!r2) {
    notify.error('读取vsb失败……')
    return
  }
  chart.load_vsb(r2)
}

async function read_vsc() {
  const r1 = await Invoke('ask-file', { file: ['vsc文件', 'vsc'] })
  if (!r1) return notify.error('读取vsc失败……')
  const r2 = await Invoke('open-file-utf', { path: r1 })
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

function open_svg() {
  modal.ChartPreviewModal.show({})
}
async function write_vsb(load_vsm= false) {
  if (load_vsm) {
    const r1 = await Invoke('ask-file', { file: ['vsm', 'vsm'] })
    if (!r1) return
   return Invoke("write-vsb", {id: chart.id, vsm: r1, diff: chart.diff.diff})
  }
  Invoke("write-vsb", {id: chart.id, diff: chart.diff.diff})
}
</script>

<template>
  <simple-modal size="1" title="好多东西啊……">
    <div class="vsc-loader-wrapper">
      <Hide :def="true" title="导入/导出">
        <div class="iexports">
          <a-button2 msg="导入vsb" @click="read_vsb" />
          <a-button2 msg="导入vsc" @click="read_vsc" />
          <a-button2 msg="导入osz" @click="import_osz" />
        </div>
      </Hide>
      <Hide :def="true" title="导出">
        <div class="iexports">
          <a-button2 msg="导出vsc" @click="write_vsc" />
          <a-button2 msg="导出svc" @click="export_svc" />
          <a-button2 msg="导出zip" @click="export_zip" />
          <a-button2 v-if="chart.diff.notes.length != 0" msg="导出svg" @click="open_svg" />
          <a-button2 msg="导出vsb"  @click="write_vsb"/>
          <a-button2 msg="导出vsb+mod" @click="write_vsb(true)" />
        </div>
      </Hide>
      <Hide title="gml">
        <IexporterGml />
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
</style>
