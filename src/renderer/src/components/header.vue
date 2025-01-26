<script lang="ts" setup>
import ui from '@renderer/core/ui'
const ipcRenderer = Electron.ipcRenderer
</script>

<template>
  <div class="header-wrapper">
    <div class="header-top">
      <img alt="wug" class="header-wug" src="/wug.jpg" />
      <div class="header-menu-ul">
        <div class="h-menu-btn h-menu-btn-text">文件</div>
        <div class="h-menu-btn-i">
          <div class="h-menu-btn h-menu-btn-text" @click="ui.ask_open()">打开</div>
        </div>
      </div>
    </div>
    <div class="header-win-func">
      <div class="header-max" @click="ipcRenderer.send('window-max')">1</div>
      <div class="header-min" @click="ipcRenderer.send('window-min')">2</div>
      <div class="header-close" @click="ipcRenderer.send('window-close')">0</div>
    </div>
  </div>
</template>

<style scoped>
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
}

.header-wug {
  height: 30px;
  margin: 0 15px;
  border-radius: 5px;
  border: 2px solid transparent;
}

.header-menu-ul {
  position: relative;
  align-items: center;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.h-menu-btn-text {
  margin: 0 15px;
  color: #c0e5f8;
  font-weight: lighter;
  width: max-content;
  transition: all 0.2s ease;
  background: transparent;
  padding: 0 5px;
  text-align: center;
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
}

.header-menu-ul:hover .h-menu-btn-i {
  opacity: 1;
  pointer-events: all;
  user-select: all;
}

.header-menu-ul:hover {
  overflow: visible;
}

.header-win-func {
  height: 100%;
  -webkit-app-region: no-drag;
  font-family: Webdings, sans-serif;
}

.header-close {
  background-color: transparent;
  color: #b8dcee;
  height: 100%;
  line-height: var(--height-header);
  width: 4rem;
  text-align: center;
  transition: all 0.2s linear;
  user-select: all;
  box-sizing: border-box;
  cursor: pointer;
}

.header-close:hover {
  background-color: #ff1145;
  color: #0d1418;
}
</style>
