<script lang="ts" setup>
import ui from '@renderer/core/ui'
import settings from '@renderer/core/settings'
import Translations from '@renderer/core/translations'
import { modal } from '@renderer/core/modal'

const Language = Translations.current

const ipcRenderer = ui.ipcRenderer

const isMax = ui.isMaximized
const { state, chart_name } = ui
const lang = settings.lang
function readVsb () {
  if (!ui.chart) return
  ui.chart.read_vsb()
}
</script>

<template>
  <div class="header-wrapper" :key="lang">
    <div  class="header-top">
      <img alt="wug" class="header-wug" src="/wug.jpg" />
      <div class="header-menu-ul">
        <div class="h-menu-btn-text" v-html="Language.header.file.title" />
        <div class="h-menu-btn-i">
          <div class="h-menu-btn-text" @click="ui.ask_open()" v-html="Language.header.file.open" />
          <div v-if="state == 'charting'" class="h-menu-btn-text" @click="readVsb">读取vsb</div>
        </div>
      </div>
      <div class="header-menu-ul">
        <div
          class="h-menu-btn-text"
          @click="modal.SettingModal.show({})"
          v-html="Language.settings.title"
        />
      </div>
      <div v-if="state == 'charting'" class="chart-name">{{ chart_name }}</div>
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
  background: linear-gradient(90deg, rgba(32, 33, 70, 1) 0%, rgba(37, 49, 50, 1) 100%);
  box-shadow: #0d1418 0 0 5px;
  font-size: 1.25em;
  z-index: 9;
  height: var(--height-header);
}

.header-top {
  display: flex;
  height: 100%;
  align-items: center;
  -webkit-app-region: drag;
  flex-grow: 1;
  pointer-events: all;
}

.header-wug {
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
  height: var(--height-header);
  line-height: var(--height-header);
  user-select: none;
  -webkit-app-region: no-drag;
}

.h-menu-btn-i {
  opacity: 0;
  transition: opacity 0.2s linear;
  background: rgb(32, 33, 70);
  border-top: #b8dcee 2px solid;
  box-sizing: border-box;
  pointer-events: none;
  user-select: none;
  border-radius: 0 0 5px 5px;
  position: absolute;
  top: var(--height-header);
  left: 0;
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
  z-index: 114514;
}

.header-win-func > div {
  width: 4rem;
  text-align: center;
  transition: all 0.2s linear;
  box-sizing: border-box;
  cursor: pointer;
  color: #b8dcee;
  height: 100%;
  line-height: var(--height-header);
}

.header-close:hover {
  background-color: #ff1145;
  color: #0d1418;
}
</style>
