<script lang="ts" setup>
import Translations from '@renderer/core/translations'
import { Charter } from '@renderer/core/charter'
import { _chart } from '@renderer/core/chart'

const Language = Translations

const ipcRenderer = Charter.ipcRenderer

const isMax = Charter.refs.window.isMaximized
const { state } = Charter
const { lang } = Charter.settings.to_refs
const song_name = Charter.refs.current_name
const record_mode = Charter.record.mode

function readVsb() {
  Charter.invoke
    .ask_vsb()
    .then((r1) => {
      if (!r1) return
      return Charter.invoke.read_vsb(r1.path)
    })
    .then((r) => {
      if (_chart.current) {
        _chart.current.load_vsb(r)
      }
    })
}

function open_chart() {
  _chart.open_chart().catch(() => {
    Charter.state.value = 'startUp'
  })
}
</script>

<template>
  <div :key="lang" class="header-wrapper">
    <div class="header-top">
      <img alt="wug" class="header-wug" src="/wug.jpg" />
      <div class="header-menu-ul">
        <div class="h-menu-btn-text"
             :class="state == 'startUp' ? 'rainbow-text' :''"
             v-html="Language.header.file.title" />
        <div class="h-menu-btn-i">
          <div class="h-menu-btn-text" @click="open_chart()" v-html="Language.header.file.open" />
          <div v-if="state == 'charting'" class="h-menu-btn-text" @click="readVsb">读取vsb</div>
        </div>
      </div>
      <div class="header-menu-ul">
        <div
          class="h-menu-btn-text"
          @click="Charter.modal.SettingModal.show({})"
          v-html="Language.settings.title"
        />
      </div>
      <div v-if="state == 'charting'" class="header-menu-ul">
        <div
          v-if="record_mode == false"
          class="h-menu-btn-text"
          @click="
            () => {
              record_mode = true
              Charter.settings.meter(1)
            }
          "
          v-html="Language.header.record.open"
        />
        <div
          v-if="record_mode == true"
          class="h-menu-btn-text"
          @click="record_mode = false"
          v-html="Language.header.record.exit"
        />
        <div class="h-menu-btn-i">
          <div
            class="h-menu-btn-text"
            @click="Charter.modal.RecordModal.show({})"
            v-html="Language.header.record.setting"
          />
        </div>
      </div>
      <div v-if="state == 'charting'" class="chart-name">{{ song_name }}</div>
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
  line-height: var(--height-header);
}

.header-close:hover {
  background-color: #ff1145;
  color: #0d1418;
}
</style>
