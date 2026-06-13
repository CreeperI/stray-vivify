<script lang="ts" setup>
import { Preinit } from '@renderer/core/misc/preinit'
import { GlobalStat } from '@renderer/core/globalStat'

const stages = Preinit.Stages
const ipcRenderer = window.electron.ipcRenderer
</script>

<template>
  <div class="preinit-wrapper">
    <div class="preinit">
      <div class="preinit-title">
        <div>stray-vivify</div>
        <div>loading...</div>
      </div>
      <div class="load-stages">
        <div class="load-header">Load Progress</div>
        <div>Load Settings</div>
        <div>{{ stages.load_settings }}</div>
        <div>Load All Chart</div>
        <div>{{ stages.all_chart }}</div>
        <div>Load Debugs</div>
        <div>{{ stages.debugs }}</div>
        <div>Load Intervals</div>
        <div>{{ stages.intervals }}</div>
        <div>Load Animation Frame</div>
        <div>{{ stages.animation_frame }}</div>
        <div>Load Skin</div>
        <div>{{ stages.check_skin }}</div>
      </div>
      <div class="win-func">
        <div @click="ipcRenderer.send('window-min')">0</div>
        <div @click="ipcRenderer.send('window-max')">1</div>
        <div class="header-close" @click="GlobalStat.close_app()">r</div>
      </div>
    <div>
      如果在某个阶段一直卡住说明大概率是出bug了。请检查控制台。
    </div>
    </div>
  </div>
</template>

<style scoped>
.preinit-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  left: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.preinit {
  display: flex;
  flex-direction: column;
  text-align: center;
  align-items: center;
}
.preinit-title {
  margin-bottom: 50px;
  font-size: 1.2rem;
}
.load-stages {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: min-content;
  text-wrap: nowrap;
  gap: 0 20px;
}
.load-header {
  font-weight: bold;
  font-size: 1.2rem;
  grid-column: span 2;
  padding-bottom: 25px;
  margin-bottom: 25px;
  border-bottom: 2px solid #b8dcee;
}
.win-func {
  -webkit-app-region: no-drag;
  font-family: Webdings, sans-serif;
  display: flex;
  align-self: center;
  background: var(--purple-bgi);
  margin-top: 50px;
}

.win-func > div {
  width: 4rem;
  text-align: center;
  transition: all 0.2s linear;
  box-sizing: border-box;
  cursor: pointer;
  color: #b8dcee;
  height: 100%;
  line-height: var(--header-height);
}
</style>
