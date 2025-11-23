<script lang="ts" setup>
import { GlobalStat } from '@renderer/core/globalStat'
import { modal } from '@renderer/core/modal'
import { Chart } from '@renderer/core/chart/chart'
import { Invoke, Send } from '@renderer/core/ipc'

const active = defineModel<number>()

const sender = Send as (m: string) => void

const isMax = GlobalStat.window_max_state

const song_name = GlobalStat.refs.header_display

function close_chart() {
  if (Chart.current) {
    Chart.current.save()
    Chart.current.audio.pause()
  }
  Chart.current = undefined
  GlobalStat.route.change('start')
  Invoke("set-process-name", "stray/vivify")
}
function open_exporter() {
  modal.IExporterModal.show({})
}
function open_custom() {
  modal.ExportCustomModal.show({})
}

function start_play() {
  Chart.$current.init_playfield()
  GlobalStat.chart_state.value = 2
}
function start_preview() {
  GlobalStat.chart_state.value = 1
}

const on = GlobalStat.refs.chart_tab

function is_active(i: number, i1: number) {
  return i == i1 ? 'header-active' : ''
}
</script>

<template>
  <div class="header-wrapper">
    <div class="header-top">
      <img alt="wug" class="header-yq" src="/yq.jpg" />
      <div class="header-menu-ul">
        <div class="h-menu-btn-text">工具</div>
        <div class="h-menu-btn-i">
          <div class="h-menu-btn-text" @click="open_exporter">导入/导出</div>
          <div class="h-menu-btn-text" @click="open_custom">Custom</div>
          <div class="h-menu-btn-text h-menu-btn-i-sep" @click="modal.SettingModal.show({})">
            设置
          </div>
          <div class="h-menu-btn-text" @click="close_chart">关闭文件</div>
        </div>
      </div>
      <div :class="is_active(on, 1)" class="header-menu-ul" @click="active = 1">
        <div class="h-menu-btn-text">曲目</div>
      </div>
      <div :class="is_active(on, 2)" class="header-menu-ul" @click="active = 2">
        <div class="h-menu-btn-text">编排</div>
      </div>
      <div :class="is_active(on, 3)" class="header-menu-ul" @click="active = 3">
        <div class="h-menu-btn-text">时轴</div>
      </div>
      <div :class="is_active(on, 4)" class="header-menu-ul" @click="active = 4">
        <div class="h-menu-btn-text">SV</div>
      </div>
      <div class="header-menu-ul" @click="start_preview">
        <div class="h-menu-btn-text">预览</div>
      </div>
      <div class="header-menu-ul" @click="start_play">
        <div class="h-menu-btn-text">试玩</div>
      </div>
      <div class="chart-name">{{ song_name }}</div>
    </div>
    <div class="header-win-func">
      <div @click="sender('window-min')">0</div>
      <div v-if="isMax" @click="sender('window-max')">2</div>
      <div v-else @click="sender('window-max')">1</div>
      <div class="header-close" @click="sender('window-close')">r</div>
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
  transition: all 0.2s linear;
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
  width: max-content;
  padding: 5px 10px;
}

.h-menu-btn-i > .h-menu-btn-text {
  transition: background-color 0.2s linear;
  font-size: 0.95rem;
  padding: 0 3px;
  width: 100%;
  margin: 0;
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
.header-active {
  background-color: #3c3e6e;
}
</style>
