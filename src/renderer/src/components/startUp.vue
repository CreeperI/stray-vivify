<script lang="ts" setup>
import Storage from '@renderer/core/storage'
import Translations from '@renderer/core/translations'
import { Charter } from '@renderer/core/charter'
import { _chart } from '@renderer/core/chart'

const proj = Storage.projects

function open_proj(p: string) {
  _chart.open_chart(p).catch(() => {
    Charter.state.value = 'startUp'
  })
}

const flag = Charter.update.flag

function toDate(time: number): string {
  const dt = new Date(time * 1000) // JavaScript 的 Date 构造函数使用毫秒，所以需要乘以 1000
  const now = new Date()
  const delta = now.getTime() - dt.getTime()

  if (delta <= 120 * 1000) {
    return '刚刚'
  } else if (delta < 3600 * 1000) {
    return `${Math.floor(delta / (60 * 1000))}分钟以前`
  } else if (delta < 21600 * 1000) {
    return `${Math.floor(delta / (3600 * 1000))}小时以前`
  } else if (dt.getFullYear() === now.getFullYear()) {
    return `${dt.getMonth() + 1}月${dt.getDate()}日 ${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`
  } else {
    return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日 ${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`
  }
}
</script>

<template>
  <div class="start-up">
    <div class="start-projects" :key="flag">
      <div class="start-projects-title" v-html="Translations.start.recent" />
      <div
        v-for="p in proj"
        :key="p.last_open"
        class="start-projects-proj"
        @click="open_proj(p.path)"
      >
        <div class="proj-name" v-html="p.name" />
        <div style="display: flex; flex-wrap: nowrap">
          <span class="proj-date" v-html="toDate(p.last_open)" />
          <span class="proj-path" v-html="p.path" />
        </div>
      </div>
    </div>
    <div class="start-right">
      <div>点击顶部栏的文件-打开以开始写谱。</div>
      <div>点击右下角build以查看更新记录！</div>
    </div>
  </div>
</template>

<style scoped>
.start-up {
  width: calc(80% - 120px);
  left: 10%;
  position: relative;
  padding: 60px;
  top: 15%;
  height: calc(70% - 120px);
  box-shadow: #001b1b 0 0 55px;
  background-image: var(--dark-bgi);
  border-radius: 65px;
  display: grid;
  grid-template-columns: 3fr 1fr;
}

.start-projects {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  padding-right: 20px;

  border-right: #8d8d8d 1px solid;
}

.start-projects-proj {
  cursor: pointer;
  transition: all 0.2s linear;
  border: transparent 2px solid;
  box-sizing: border-box;
  padding: 0;
  border-radius: 4px;
}

.start-projects-proj:hover {
  border-left: #b8dcee 2px solid;
  padding-left: 10px;
}

.proj-date {
  min-width: 3rem;
}

.proj-name {
  font-size: 1.4rem;
  line-height: 1.2em;
}

.proj-path {
  text-wrap: nowrap;
  opacity: 0.7;
  display: inline-block;
}

.start-projects-title {
  width: 100%;
  text-align: center;
  font-size: 1.7rem;
  font-weight: bolder;
  margin-bottom: 20px;
}

.start-right {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
