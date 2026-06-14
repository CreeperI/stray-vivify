<script lang="ts" setup>
import { modal } from '@renderer/core/misc/modal'
import { Invoke } from '@renderer/core/ipc'
import { GlobalStat } from '@renderer/core/globalStat'
import "./header.css"

const ipcRenderer = window.electron.ipcRenderer

const isMax = GlobalStat.window_max_state
async function import_svc() {
  const fp = await Invoke("ask-file", {file: ["Chart", "zip", "svc"]})
  if (!fp) return
  const id = await modal.AskIdModal.show({all: GlobalStat.all_chart.map(x => x.id)}) as undefined | string
  if (!id) return
  await Invoke("import-zip", {fp: fp, id: id})
  await GlobalStat.update_all_chart()
}
async function import_osz() {
  const fp = await Invoke("ask-file", {file: ["OSZ", "osz"]})
  if (!fp) return
  const id = await modal.AskIdModal.show({all: GlobalStat.all_chart.map(x => x.id)}) as undefined | string
  if (!id) return
  await Invoke("import-osz", {fp: fp, id: id})
  await GlobalStat.update_all_chart()
}
</script>

<template>
  <div class="header-wrapper">
    <div class="header-top">
      <img alt="wug" class="header-yq" src="/yq.jpg" />
      <div class="header-menu-ul">
        <div class="h-menu-btn-text" @click="modal.SettingModal.show({})">设置</div>
      </div>
      <div class="header-menu-ul">
        <div class="h-menu-btn-text">导入</div>
        <div class="h-menu-btn-i">
          <div class="h-menu-btn-text" @click="import_svc">svc</div>
          <div class="h-menu-btn-text" @click="import_osz">osz</div>
        </div>
      </div>
    </div>
    <div class="header-win-func">
      <div @click="ipcRenderer.send('window-min')">0</div>
      <div v-if="isMax" @click="ipcRenderer.send('window-max')">2</div>
      <div v-else @click="ipcRenderer.send('window-max')">1</div>
      <div class="header-close" @click="GlobalStat.close_app()">r</div>
    </div>
  </div>
</template>
