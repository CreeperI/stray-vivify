<script setup lang="ts">
import { ref, watch } from 'vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import { Invoke } from '@renderer/core/ipc'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'
import { charts_data } from '@preload/types'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { modal } from '@renderer/core/modal'
import { Settings } from '@renderer/core/settings'

const shown = ref(GlobalStat.all_chart)
const search = ref('')
watch(search, (c) => {
  shown.value = GlobalStat.all_chart.filter((v) => v.name.includes(c) || v.id.includes(c))
})

const display_id = ref<string>()
const display_data = ref<charts_data[number]>()

async function import_chart() {
  const song = await Invoke('ask-song')
  if (!song) return
  const r = await Invoke('import-song', song.path)
  console.log(r)
  await GlobalStat.update_all_chart()
  shown.value = GlobalStat.all_chart
}

async function import_svc() {
  await Invoke('import-zip')
  await GlobalStat.update_all_chart()
  shown.value = GlobalStat.all_chart
}

function open_proj(id: string) {
  Chart.open_chart(id)
}

function delete_proj(id: string, name: string) {
  if (!Settings.settings.value.settings.delete_no_confirm) {
    modal.ConfirmModal.show({
      msg: `确定要删除${name} (id: ${id})吗？不可以撤销的哦！<br><small>设置中可以关闭此确认。</small>`
    }).then(() => {
      return Invoke('remove-chart', id)
    }).then(() => {
      GlobalStat.update_all_chart()
    })
  } else {
    Invoke('remove-chart', id)
  }
}

function detail(id: string) {
  const ch = GlobalStat.all_chart.find((v) => v.id == id)
  if (!ch) return
  display_id.value = id
  display_data.value = ch
}
</script>

<template>
  <div class="chart-list-wrapper">
    <div class="chart-list-left">
      <div class="su-title">stray/vivify</div>
      <div class="su-desc" v-if="!display_id">
        广告位招租 <br />
        一定要请画师来加个看板……？
      </div>
      <div class="su-display" v-if="display_data">
        <div class="sd-title">{{ display_data.name }}</div>
        <div class="sd-composer">by {{ display_data.composer }}</div>
        <div>-bpm: {{ display_data.bpm }} -id: {{ display_data.id }}</div>
        <br />
        <div class="sd-diff">
          <div>charts:</div>
          <div v-for="d in display_data.diffs">> {{ d }}</div>
        </div>
      </div>
    </div>
    <div class="chart-list-right">
      <div class="charts-func">
        <div class="search-wrapper">
          <a-text-input v-model="search" placeholder="点击输入文字！" class="charts-input" />
          <div>{{ shown.length }} 结果</div>
        </div>
        <div class="importer">
          <a-button2 msg="导入曲目" @click="import_chart" />
          <a-button2 msg="导入svc" @click="import_svc" />
        </div>
      </div>
      <div class="charts-wrapper">
        <TransitionGroup>
          <div
            v-for="chart in shown"
            :key="chart.id"
            class="chart-unit"
            @mouseenter="detail(chart.id)"
            @click="open_proj(chart.id)"
            @contextmenu="delete_proj(chart.id, chart.name)"
          >
            <div class="chart-unit-name">{{ chart.name }}</div>
            <div class="chart-unit-composer">{{ chart.composer }}</div>
            <div class="chart-unit-id">id: {{ chart.id }}</div>
          </div>
        </TransitionGroup>
        <div v-if="shown.length == 0">这里没有歌哦。试试导入和更换搜索方式吧！</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-list-wrapper {
  display: grid;
  grid-template-columns: 5fr 4fr;
  height: 100%;
}

.chart-list-left {
  position: relative;
}

.su-title {
  font-size: 2.5rem;
  text-align: center;
  left: 50%;
  transform: translateX(-50%);
  position: relative;
  margin-top: 10%;
}

.su-desc {
  font-size: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  top: 40%;
  position: absolute;
  width: 100%;
  text-align: center;
}

.su-display {
  margin-top: 15%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sd-title {
  font-size: 1.5rem;
}

.chart-list-right {
  display: flex;
  flex-direction: column;
}

.charts-func {
  height: 5rem;
  border-bottom: 2px solid #b8dcee;
  margin-bottom: 15px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-right: 10%;
}

.search-wrapper {
  flex-grow: 1;
  padding-left: 25px;
}
.importer {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  height: 100%;
}
.charts-input {
  width: calc(100% - 50px);
  text-align: left;
}

.charts-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-unit {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  transition: 0.2s ease all;
  cursor: pointer;
}

.chart-unit:hover {
  filter: brightness(2);
  transform: translateX(-0.8rem);
}

.chart-unit > div {
  user-select: none;
}

.chart-unit-name {
  flex-basis: 100%;
  text-align: left;
  text-wrap: nowrap;
  line-height: 1.2rem;
  font-size: 1.2rem;
  font-weight: bold;
}

.chart-unit-composer {
  text-align: left;
}

.chart-unit-id {
  text-align: right;
  opacity: 0.7;
  flex-grow: 1;
  padding-right: 10px;
}

.v-move, /* 对移动中的元素应用的过渡 */
.v-enter-active,
.v-leave-active {
  transition: all 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
</style>
