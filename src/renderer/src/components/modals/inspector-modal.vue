<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { Log } from '@renderer/core/log'
import { computed, ref } from 'vue'
import { FrameRate } from '@renderer/core/frame-rates'
import FrameRateSingle from '@renderer/components/modals/frame-rate-single.vue'
import { GlobalStat } from '@renderer/core/globalStat'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Settings } from '@renderer/core/settings'
import { utils } from '@renderer/core/utils'

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

const size = GlobalStat.ChartSize.data
function parse_chart_name(str: string) {
  return GlobalStat.all_chart.find((c) => c.name == str)?.name || str
}

GlobalStat.ChartSize.update()
</script>

<template>
  <SimpleModal size="lg" title="Log">
    <div class="inspector-wrapper">
      <div class="state-select">
        <div :class="func_state == 0 ? 'chosen' : ''" class="state-option" @click="func_state = 0">
          Log
        </div>
        <div :class="func_state == 1 ? 'chosen' : ''" class="state-option" @click="func_state = 1">
          Performance
        </div>
        <div :class="func_state == 2 ? 'chosen' : ''" class="state-option" @click="func_state = 2">
          Needed Images
        </div>
        <div :class="func_state == 3 ? 'chosen' : ''" class="state-option" @click="func_state = 3">
          谱面占用空间
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
                <th style="width: max-content">函数</th>
                <th>Min/Max</th>
                <th>avg.</th>
                <th>SD</th>
                <th>CV</th>
                <th>call_count</th>
              </tr>
              <tr>
                <td>FPS</td>
                <td>{{ _fps_r.min.toFixed(1) }}/{{ _fps_r.max.toFixed(1) }}</td>
                <td>{{ _fps_r.avg.toFixed(2) }}</td>
                <td>{{ _fps_r.sd.toFixed(2) }}</td>
                <td>{{ _fps_r.cv.toFixed(2) }}</td>
                <td>-</td>
              </tr>
              <frame-rate-single :r="FrameRate.aniFrame" msg="帧逻辑" />
              <frame-rate-single :r="FrameRate.invalidator" msg="Inspector" />
              <frame-rate-single :r="FrameRate.next_tick" msg="依赖/渲染" />
              <frame-rate-single :r="FrameRate.fuck_shown" msg="Fuck Shown" />
              <frame-rate-single :r="FrameRate.playfield_frame" msg="Play Frame" />
              <frame-rate-single :r="FrameRate.update_pending" msg="Pending-note" />
              <frame-rate-single :r="FrameRate.calc_density" msg="calc-density" />
              <frame-rate-single
                v-if="Settings.editor.star_rating"
                :r="FrameRate.calc_sr"
                msg="Star Rating"
              />
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
              <div><word-helper dec="常驻集" msg="rss" /></div>
              <div>{{ parse_size(backend.rss) }}</div>
              <div>可用</div>
              <div>{{ parse_size(backend.heapTotal) }}</div>
              <div>活跃内存</div>
              <div>{{ parse_size(backend.heapUsed) }}</div>
              <div>external</div>
              <div>{{ parse_size(backend.external) }}</div>
              <div>缓冲区</div>
              <div>{{ parse_size(backend.arrayBuffers) }}</div>
            </div>
          </div>
          <div class="fr-header">Update Rate</div>
          <table class="fr-table">
            <tbody>
              <tr>
                <th>Key</th>
                <th>Min/Max</th>
                <th>avg.</th>
                <th>SD</th>
                <th>CV</th>
              </tr>
              <tr v-for="key in utils.keyof(FrameRate.Updates)">
                <td>{{ key }}</td>
                <td>
                  {{ FrameRate.Updates[key].refs.value.min.toFixed(1) }}/{{
                    FrameRate.Updates[key].refs.value.max.toFixed(1)
                  }}
                </td>
                <td>{{ FrameRate.Updates[key].refs.value.avg.toFixed(2) }}</td>
                <td>{{ FrameRate.Updates[key].refs.value.sd.toFixed(2) }}</td>
                <td>{{ FrameRate.Updates[key].refs.value.cv.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
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
      <template v-else-if="func_state == 3">
        <div v-if="size.total != 0" class="disk-wrapper">
          <div class="disk-header">SV最爱吃内存的一集</div>
          <div class="disk-total">
            <div>总共吃掉了</div>
            <div>{{ parse_size(size.app + size.exe) }}</div>
            <div>谱面文件夹总占用</div>
            <div>{{ parse_size(size.total) }}</div>
            <div>整个sv文件夹吃掉的</div>
            <div>{{ parse_size(size.exe) }}</div>
            <div>AppData占用</div>
            <div>{{ parse_size(size.app) }}</div>
          </div>
          <div class="disk-list">
            <span class="disk-list-sep">Files</span>
            <template v-for="ch in size.detail_sf">
              <div class="disk-list-name">{{ ch[1] }}</div>
              <div>{{ parse_size(ch[0]) }}</div>
            </template>
            <br />
            <span class="disk-list-sep">Charts</span>
            <template v-for="ch in size.detail">
              <div class="disk-list-name">{{ parse_chart_name(ch[1]) }}</div>
              <div>{{ parse_size(ch[0]) }}</div>
            </template>
          </div>
        </div>
        <div v-else class="disk-wrapper-loading">Loading.......</div>
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

.disk-wrapper {
  display: grid;
  grid-template-columns: 1fr 2fr;
  user-select: none;
  height: 90%;
}
.disk-wrapper-loading {
  text-align: center;
}
.disk-header {
  grid-column: 1/3;
  margin: 15px;
  font-size: 1.5rem;
  border-bottom: 2px solid #b8dcee;
  line-height: 3rem;
  text-align: center;
}
.disk-total {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  gap: 10px;
  height: min-content;
}
.disk-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: calc(100%);
  overflow-y: auto;
}
.disk-total > div:nth-child(odd) {
  text-align: right;
  width: 100%;
}
.disk-list-name {
  text-align: right;
  padding-right: 10px;
}
.disk-list-sep {
  text-align: center;
  font-size: 1.2rem;
  grid-column: 1/3;
  border-bottom: 1px solid #b8dcee;
  margin-bottom: 5px;
  width: 6rem;
  padding: 0 5px;
  justify-self: center;
}
</style>
