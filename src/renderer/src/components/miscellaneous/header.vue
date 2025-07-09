<script lang="ts" setup>
import Translations from '@renderer/core/translations'
import { Charter } from '@renderer/core/charter'
import { Chart } from '@renderer/core/chart/chart'
import { notify } from '@renderer/core/notify'

const Language = Translations

const ipcRenderer = Charter.ipcRenderer

const isMax = Charter.refs.window.isMaximized
const { state } = Charter
const { lang } = Charter.settings.to_refs
const song_name = Charter.refs.current_name
const record_mode = Charter.record.mode

function close_chart() {
  if (Chart.current) {
    Chart.current.save()
    Chart.current.audio.pause()
    Charter.state.value = 'startUp'
    Chart.current = undefined
  }
}

async function read_vsb() {
  const r1 = await Charter.invoke('ask-vsb')
  if (!r1) {
    notify.error('读取vsb失败……')
    return
  }
  const chart = Chart.current as Chart
  chart.load_vsb(await Charter.invoke('read-vsb', r1.path))
}

async function write_vsc() {
  const chart = Chart.current
  if (!chart) throw new Error('?????')
  chart.write_current_vsc()
}
</script>

<template>
  <div :key="lang" class="header-wrapper">
    <div class="header-top">
      <img alt="wug" class="header-wug" src="/zhe-shi-shei-a.jpg" />
      <div class="header-menu-ul">
        <div class="h-menu-btn-text">文件</div>
        <div class="h-menu-btn-i">
          <div v-if="state == 'charting'" class="h-menu-btn-text" @click="read_vsb">打开vsb</div>
          <div v-if="state == 'charting'" class="h-menu-btn-text" @click="close_chart">
            关闭文件
          </div>
          <div v-if="state == 'charting'" class="h-menu-btn-text" @click="write_vsc">写入vsc</div>
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
