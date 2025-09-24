<script setup lang="ts">
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { Log } from '@renderer/core/log'
import { computed, ref } from 'vue'
import { FrameRate } from '@renderer/core/frame-rates'
import FrameRateSingle from '@renderer/components/modals/frame-rate-single.vue'
import { GlobalStat } from '@renderer/core/globalStat'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'

const func_state = ref(0)

const logs = computed(() => {
  if (level.value == 'all') return Log.error_list.value
  else return Log.error_list.value.filter((l) => l.level == level.value)
})
function toLocalDate(t: number) {
  return new Date(t).toTimeString().substring(0, 8)
}
const count = Log.count
const level = ref('all' as 'all' | 'debug' | 'msg' | 'warn' | 'err')
const needed = Log.need_img

const _fps_r = FrameRate.fps.refs

function parse_size(size: number) {
  if (size < 1024) return `${size}B`
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)}KB`
  else return `${(size / 1024 / 1024).toFixed(2)}MB`
}
const frontend = GlobalStat.MemoryUsage.frontend
const backend = GlobalStat.MemoryUsage.backend
</script>

<template>
  <SimpleModal title="Log" size="lg">
    <div class="inspector-wrapper">
      <div class="state-select">
        <div @click="func_state = 0" :class="func_state == 0 ? 'chosen' : ''" class="state-option">
          Log
        </div>
        <div @click="func_state = 1" :class="func_state == 1 ? 'chosen' : ''" class="state-option">
          Performance
        </div>
        <div @click="func_state = 2" :class="func_state == 2 ? 'chosen' : ''" class="state-option">
          Needed Images
        </div>
      </div>
      <template v-if="func_state == 0">
        <template class="counter">
          <div @click="level = 'debug'">Debug: {{ count.debug }}</div>
          <div @click="level = 'msg'">Msg: {{ count.msg }}</div>
          <div @click="level = 'warn'">Warn: {{ count.warn }}</div>
          <div @click="level = 'err'">Error: {{ count.err }}</div>
          <div @click="level = 'all'">All: {{ count.all }}</div>
          <div title="切换信息等级">信息等级：{{ level }}</div>
        </template>
        <div class="log-wrapper">
          <div v-for="l in logs" :class="l.level">
            <div>{{ toLocalDate(l.time) }}</div>
            <div>{{ l.msg }}</div>
          </div>
        </div>
      </template>
      <template v-else-if="func_state == 1">
        <div class="fr-wrapper">
          <div class="fr-header">Frame Rate</div>
          <table class="fr-table">
            <tbody>
              <tr>
                <td style="width: max-content">函数</td>
                <td>Min/Max</td>
                <td>avg.</td>
                <td>SD</td>
                <td>CV</td>
                <td>call_count</td>
              </tr>
              <tr>
                <td>FPS</td>
                <td>{{ _fps_r.min }}/{{ _fps_r.max }}</td>
                <td>{{ _fps_r.avg.toFixed(2) }}</td>
                <td>{{ _fps_r.sd.toFixed(2) }}</td>
                <td>{{ _fps_r.cv.toFixed(2) }}</td>
                <td>-</td>
              </tr>
              <frame-rate-single msg="帧逻辑" :r="FrameRate.aniFrame" />
              <frame-rate-single msg="Inspector" :r="FrameRate.invalidator" />
              <frame-rate-single msg="依赖/渲染" :r="FrameRate.next_tick" />
              <frame-rate-single msg="Fuck Shown" :r="FrameRate.fuck_shown" />
              <frame-rate-single msg="Play Frame" :r="FrameRate.playfield_frame" />
              <frame-rate-single msg="Pending-note" :r="FrameRate.update_pending" />
              <frame-rate-single msg="calc-density" :r="FrameRate.calc_density" />
            </tbody>
          </table>
          <div class="fr-header">Memory Usage</div>
          <div class="memory-wrapper">
            <div>
              <span>Vue</span>
              <div>可用</div>
              <div>{{ parse_size(frontend.jsHeapSizeLimit) }}</div>
              <div>已分配</div>
              <div>{{ parse_size(frontend.totalJSHeapSize) }}</div>
              <div>活跃</div>
              <div>{{ parse_size(frontend.usedJSHeapSize) }}</div>
            </div>
            <div>
              <span>Node</span>
              <div><word-helper msg="rss" dec="常驻集"/></div>
              <div>{{ parse_size(backend.rss) }}</div>
              <div>可用</div>
              <div>{{parse_size(backend.heapTotal)}}</div>
              <div>活跃内存</div>
              <div>{{parse_size(backend.heapUsed)}}</div>
              <div>external</div>
              <div>{{parse_size(backend.external)}}</div>
              <div>缓冲区</div>
              <div>{{parse_size(backend.arrayBuffers)}}</div>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="func_state == 2">
        <div class="imgs-wrapper">
          <div class="imgs-header">
            <div>需要的图片</div>
            <div>请求次数</div>
          </div>
          <div class="imgs-header">
            <div>需要的图片</div>
            <div>请求次数</div>
          </div>
          <div v-for="i in needed">
            <div v-html="i[0]"></div>
            <div v-html="i[1]"></div>
          </div>
        </div>
      </template>
    </div>
  </SimpleModal>
</template>

<style scoped>
.inspector-wrapper {
  height: 60vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.log-wrapper {
  overflow: auto;
  width: calc(90% - 20px);
  display: flex;
  flex-direction: column;
  margin-left: 5%;
  background: var(--darker-bgi);
  margin-bottom: 5%;
  border: 2px solid white;
  padding: 5px;
  gap: 5px;
  flex-grow: 1;
}
.state-select {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  margin-bottom: 5px;
}
.state-option {
  flex-grow: 1;
  text-align: center;
  border: 2px solid #b8dcee;
  padding: 3px;
  border-right: 2px transparent;
  background: #0d1418;
  cursor: pointer;
  transition: background-color 0.2s linear;
}
.state-option:last-child {
  border-right: 2px solid #b8dcee;
}
.chosen {
  background: #3b4652;
}
.counter {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  padding-bottom: 2rem;
  margin-left: 5%;
}
.counter > div:not(:last-child) {
  cursor: pointer;
}
.counter > div:last-child {
  cursor: help;
}
.log-wrapper > div {
  display: grid;
  grid-template-columns: 5rem 1fr;
  word-break: break-all;
}
.warn {
  background: #f3ff1f66;
}
.err {
  background: darkred;
}
.fr-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  user-select: none;
}
.fr-header {
  width: 100%;
  text-align: center;
  line-height: 3rem;
  font-size: 1.5rem;
  font-weight: bold;
}
.fr-table {
  width: 90%;
  margin-left: 5%;
  text-align: center;
  border-collapse: collapse;
  table-layout: fixed;
}
td {
  border: 1px solid white;
}
.fr-table tr:first-child {
  background: #0d1418;
  line-height: 1.4rem;
}
.imgs-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow-y: hidden;
  max-height: 100%;
  margin-top: 15px;
}
.imgs-header {
  border-bottom: 2px solid #b8dcee;
  border-collapse: collapse;
  line-height: 1.5rem;
  margin-bottom: 10px;
}
.imgs-wrapper > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  justify-items: center;
}
.memory-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  user-select: none;
}
.memory-wrapper > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.memory-wrapper > div > span {
  width: 100%;
  grid-column: 2;
}
.memory-wrapper > div > div {
  padding: 0 5px;
}
.memory-wrapper > div > div:nth-child(2n) {
  text-align: right;
}
</style>
