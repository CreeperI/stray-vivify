<script setup lang="ts">
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { Log } from '@renderer/core/log'
import { computed, ref } from 'vue'
import { FrameRate } from '@renderer/core/frame-rates'
import FrameRateSingle from '@renderer/components/modals/frame-rate-single.vue'

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

const _fps_r = FrameRate.fps.refs
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
</style>
