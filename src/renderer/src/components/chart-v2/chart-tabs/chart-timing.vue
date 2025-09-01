<script setup lang="ts">
import { Chart } from '@renderer/core/chart/chart'
import TimingSingle from '@renderer/components/chart-v2/timing-single.vue'
import { computed, provide, ref } from 'vue'
import { GlobalStat } from '@renderer/core/globalStat'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'

const chart = Chart.$current
const diff = chart.diff
const index = ref(-1)
const bpm_input = ref<HTMLInputElement>()
provide('focus', (idx: number) => {
  index.value = idx
  bpm_input.value?.focus()
})
const bpm_comp = computed({
  get() {
    return diff.timing[index.value].bpm
  },
  set(value) {
    diff.timing[index.value].bpm = value
  }
})
const num_comp = computed({
  get() {
    return diff.timing[index.value].num
  },
  set(value) {
    diff.timing[index.value].num = value
  }
})
const den_comp = computed({
  get() {
    return diff.timing[index.value].den
  },
  set(value) {
    diff.timing[index.value].den = value
  }
})
const time = computed({
  get() {
    return diff.timing[index.value].time
  },
  set(value) {
    diff.timing[index.value].time = value
  }
})

function del_timing(ix: number) {
  if (ix == 0) return
  diff.timing.splice(ix, 1)
  index.value = -1
}
function add_timing() {
  let r = diff.add_timing({
    bpm: 120,
    num: 4,
    den: 4,
    time: chart.audio.current_time
  })
  if (r != -1) {
    index.value = r
  }
}

function switcher(t:number) {
  chart.audio.set_current_time(t)
  GlobalStat.refs.chart_tab.value = 2
}
</script>

<template>
  <div class="timing-wrapper">
    <div class="timing-left">
      <div class="timing-list">
        <div class="timing-header">
          <div>Timing List</div>
          <a-button2 class="timing-add" @click="add_timing" msg="+new Timing" />
        </div>
        <timing-single
          :class="index == idx ? 'chosen' : ''"
          :idx="idx"
          :timing="t"
          v-for="(t, idx) in diff.timing"
          @click="index = idx"
          @click.ctrl.capture="switcher(t.time)"
        />
      </div>
    </div>
    <div class="timing-right">
      <div class="timing-editor" v-if="index != -1">
        <div class="timing-index">timing #{{ index }}</div>
        <div>
          <span>Time</span>
          <input class="timing-input" type="number" min="0" v-model="time" />
        </div>
        <div>
          <span>BPM</span>
          <input ref="bpm_input" class="timing-input" type="number" min="1" v-model="bpm_comp" />
        </div>
        <div style="display: flex; justify-content: center; align-items: center">
          <span>拍号</span>
          <div class="timing-signature">
            <input class="timing-input" type="number" min="1" v-model="num_comp" />
            <div style="border: 1px solid #b8dcee"></div>
            <input class="timing-input" type="number" min="1" v-model="den_comp" />
          </div>
        </div>

        <div
          class="timing-delete"
          :class="index == 0 ? 'timing-first' : ''"
          @click="del_timing(index)"
        >
          删除
        </div>
      </div>
      <div class="timing-placeholder" v-else-if="diff.timing.length == 1">没有变奏呢。好曲师！</div>
      <div class="timing-placeholder" v-else-if="diff.timing.length == 0">
        为什么这里一个timing都没有，我代码哪里炸了？
      </div>
      <div class="timing-placeholder" v-else>啊啊好多bpm看不懂变奏谱……谁能教我打变奏</div>
    </div>
  </div>
</template>

<style scoped>
.timing-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  position: relative;
}
.timing-left {
  bottom: 0;
  margin: 50px 50px 0;
  background: var(--darker-bgi);
  box-shadow: 0 0 10px 10px #000;
  width: 50%;
}
.timing-header {
  line-height: 1.6rem;
  border-bottom: 2px solid #b8dcee;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  padding-left: 15px;
}
.timing-add {
  border-radius: 3px;
  background:var(--purple-bgi);
  line-height: 1.6rem;
  height: 1.6rem;
  cursor: pointer;
  user-select: none;
}
.timing-list {
  padding: 15px;
}
.chosen {
  background: var(--button-hover);
}
.timing-right {
  position: absolute;
  right: 0;
  background: var(--darker-bgi);
  max-width: 35vw;
  width: 30%;
  top: calc(45% - 25vh);
  padding: 30px;
  border-radius: 15px 0 0 15px;
  height: 50vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.timing-placeholder {
  color: #3b4652;
  font-style: italic;
  text-align: center;
  position: relative;
  top: -50px;
}
.timing-editor {
  text-align: center;
}
.timing-index {
  margin-bottom: 40px;
}
.timing-input {
  border-radius: 5px 5px 0 0;
  line-height: 1.5rem;
  height: 1.4rem;
  font-size: 1rem;
  margin: 5px;
  text-align: center;
  border: none;
  border-bottom: 2px solid #000;
  background: var(--purple-bgi);
}
.timing-input::-webkit-inner-spin-button,
.timing-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
.timing-signature {
  display: flex;
  flex-direction: column;
  max-width: 5rem;
  margin-left: 5px;
}
.timing-delete {
  border: 2px solid crimson;
  width: 6rem;
  height: 2rem;
  line-height: 2rem;
  left: calc(50% - 3rem);
  position: relative;
  margin-top: 25px;
  cursor: pointer;
  user-select: none;
}
.timing-first {
  cursor: not-allowed;
  filter: brightness(0.6);
  font-style: italic;
}
</style>
