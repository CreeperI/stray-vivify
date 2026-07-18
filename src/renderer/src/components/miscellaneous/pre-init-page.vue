<script lang="ts" setup>
import { Preinit } from '@renderer/core/misc/preinit'
import { GlobalStat } from '@renderer/core/globalStat'
import "./loading.css"
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
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
      <div>
        <a-button2 msg="打开控制台" @click="ipcRenderer.send('open-dev')"/>
      </div>
    </div>
  </div>
</template>
