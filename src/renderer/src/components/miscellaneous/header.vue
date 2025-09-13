<script lang="ts" setup>
import { Charter } from '@renderer/core/charter'
import { modal } from '@renderer/core/modal'
import { Invoke } from '@renderer/core/ipc'
import { GlobalStat } from '@renderer/core/globalStat'

const ipcRenderer = Charter.ipcRenderer

const isMax = Charter.refs.window.isMaximized

async function import_svc() {
  await Invoke('import-zip')
  await GlobalStat.update_all_chart()
}
async function import_osz() {
  await Invoke('import-from-osz')
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
      <div class="header-close" @click="ipcRenderer.send('window-close')">r</div>
    </div>
  </div>
</template>

<style scoped>
div {
  user-select: none;
}

.header-wrapper {
  width: 100%;
  position: sticky;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  background: rgb(32, 33, 70);
  background: var(--purple-bgi);
  box-shadow: #0d1418 0 0 5px;
  font-size: 1.2rem;
  line-height: 2rem;
  z-index: 9;
  height: 2rem;
}

.header-top {
  display: flex;
  height: 100%;
  align-items: center;
  -webkit-app-region: drag;
  flex-grow: 1;
  pointer-events: all;
}

.header-yq {
  height: 30px;
  margin: 0 15px;
  border-radius: 5px;
  border: 2px solid transparent;
}

.chart-name {
  text-align: left;
  padding-left: 50px;
  border-left: #8d8d8d 2px solid;
  overflow: hidden;
  text-wrap: nowrap;
}

.header-menu-ul {
  position: relative;
  align-items: center;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.h-menu-btn-text {
  margin: 0 15px;
  color: #c0e5f8;
  font-weight: lighter;
  width: max-content;
  transition: all 0.2s ease;
  background: transparent;
  padding: 0 5px;
  text-align: left;
  cursor: pointer;
  border-radius: 5px;
  border: 1px solid transparent;
  box-sizing: border-box;
  line-height: var(--header-height);
  user-select: none;
  -webkit-app-region: no-drag;
}

.h-menu-btn-i {
  opacity: 0;
  transition: opacity 0.2s linear;
  background: rgb(32, 33, 70);
  border-top: #b8dcee 3px solid;
  box-sizing: border-box;
  pointer-events: none;
  user-select: none;
  border-radius: 0 0 5px 5px;
  position: absolute;
  top: var(--header-height);
  left: 0;
  width: 90%;
  padding: 5px 10px;
}

.h-menu-btn-i > .h-menu-btn-text {
  transition: background-color 0.2s linear;
  padding: 0 3px;
  width: 100%;
  margin: 0;
  text-align: center;
}
.h-menu-btn-i > .h-menu-btn-text:hover {
  background: #303156;
}
.h-menu-btn-i > .h-menu-btn-i-sep {
  border-top: 1px solid #b8dcee;
  border-radius: 0 0 5px 5px;
  margin-top: 3px;
}

.header-menu-ul:hover .h-menu-btn-i {
  opacity: 1;
  pointer-events: all;
  user-select: all;
}

.header-win-func {
  height: 100%;
  -webkit-app-region: no-drag;
  font-family: Webdings, sans-serif;
  display: flex;
  position: absolute;
  right: 0;
  background-color: rgb(32, 33, 70);
  z-index: var(--z-highest);
}

.header-win-func > div {
  width: 4rem;
  text-align: center;
  transition: all 0.2s linear;
  box-sizing: border-box;
  cursor: pointer;
  color: #b8dcee;
  height: 100%;
  line-height: var(--header-height);
}

.header-close:hover {
  background-color: #ff1145;
  color: #0d1418;
}
</style>
