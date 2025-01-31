<script lang="ts" setup>
import ui from '@renderer/core/ui'
import { watch } from 'vue'
import Translations from '@renderer/core/translations'
import ASelect from '@renderer/components/a-select.vue'

const setting = ui.charter.settings
const { note_type, scale, meter, middle } = setting
const Language = Translations.current

watch(scale, (v) => {
  if (isFinite(Number(v))) {
    v = Math.floor(v * 10) / 10
    scale.value = Math.min(Math.max(Number(v), 0.1), 20)
  } else scale.value = 1
})

watch(meter, (v) => {
  if (isFinite(Number(v))) {
    v = Math.floor(v)
    meter.value = Math.min(Math.max(Number(v), 1), 64)
  } else meter.value = 4
})

const { note_choice } = ui
if (!ui.chart) throw new Error('')
const chart = ui.chart
const { diff, diff_flag, diff_index, currentTimeRef, play_rate_ref } = ui.chart

function toTimeStr(seconds: number) {
  return Math.floor(seconds / 60) + ':' + (seconds % 60).toFixed(3)
}
</script>

<template>
  <div class="fp-wrapper">
    <div>
      <div class="fp-title" v-html="Language.fp.charter" />
      <div class="mode-set">
        <div v-html="Language.fp.scale" />
        <input v-model="scale" list="scale-list" max="20" min="0.1" step="0.1" type="range" />
        <input v-model="scale" max="20" min="0.1" step="0.1" type="number" />
        <datalist id="scale-list">
          <option value="0.5"></option>
          <option value="1"></option>
          <option value="2"></option>
          <option value="3"></option>
          <option value="5"></option>
        </datalist>
      </div>
      <div class="mode-set">
        <div v-html="Language.fp.meter" />
        <input v-model="meter" list="meter-list" max="64" min="1" step="1" type="range" />
        <input v-model="meter" max="64" min="1" step="1" type="number" />
        <datalist id="meter-list">
          <option value="1"></option>
          <option value="4"></option>
          <option value="6"></option>
          <option value="8"></option>
          <option value="12"></option>
          <option value="16"></option>
          <option value="24"></option>
          <option value="32"></option>
          <option value="48"></option>
          <option value="64"></option>
        </datalist>
      </div>
    </div>
    <div>
      <div class="fp-title" v-html="Language.fp.note.title" />
      <div class="notes">
        <div :class="note_type == 'n' ? 'note-chosen' : ''" @click="note_choice('n')">
          <img alt="Note.png" src="/noteL.png" />
          <div>
            <div>(1)</div>
            <div v-html="Language.fp.note.chip" />
          </div>
        </div>
        <div :class="note_type == 'b' ? 'note-chosen' : ''" @click="note_choice('b')">
          <img alt="Bumper.png" src="/bL.png" />
          <div>
            <div>(2)</div>
            <div v-html="Language.fp.note.bumper" />
          </div>
        </div>
        <div :class="note_type == 'm' ? 'note-chosen' : ''" @click="note_choice('m')">
          <img alt="Note.mine.png" src="/bomb.png" />
          <div>
            <div>(3)</div>
            <div v-html="Language.fp.note.mine" />
          </div>
        </div>
        <div :class="note_type == 'mb' ? 'note-chosen' : ''" @click="note_choice('mb')">
          <img alt="Bumper.mine.png" src="/bB.png" />
          <div>
            <div>(4)</div>
            <div v-html="Language.fp.note.mb" />
          </div>
        </div>
        <div :class="note_type == 'h' ? 'note-chosen' : ''" @click="note_choice('h')">
          <img alt="Note.png" src="/noteL.png" />
          <div>
            <div>(5)</div>
            <div v-html="Language.fp.note.hold" />
          </div>
        </div>
        <div :class="note_type == 's' ? 'note-chosen' : ''" @click="note_choice('s')">
          <img alt="Bumper.png" src="/sbL.png" />
          <div>
            <div>(6)</div>
            <div v-html="Language.fp.note.sb" />
          </div>
        </div>
      </div>
      <div class="note-setting">
        <label for="middle">
          <input id="middle" v-model="middle" type="checkbox" />
          <span v-html="Language.fp.note.middle" />
        </label>
      </div>
    </div>
    <div id="chart-information">
      <div class="fp-title" v-html="Language.fp.chart.title"></div>
      <div class="chart-settings">
        <label v-html="Language.fp.song.composer"></label>
        <input v-model="chart.song.composer" @change="chart.refresh()">
        <label v-html="Language.fp.song.name"></label>
        <input v-model="chart.song.name" @change="chart.refresh()">
        <label v-html="Language.fp.chart.name"></label>
        <input v-model="diff.name" type="text" @input="chart.refresh()"/>
        <label v-html="Language.fp.chart.level" />
        <input v-model="diff.hard" type="text" />
        <label v-html="Language.fp.song.bpm" />
        <input v-model="chart.song.bpm" min="0.1" type="number" />
        <label v-html="Language.fp.chart.choose" />
        <!--        <select :key="diff_flag" v-model="diff_index">-->
        <!--          <option v-for="(v, i) in chart.diffs" :key="i" :value="i">{{ v.name }}</option>-->
        <!--        </select>-->
        <a-select
          v-model="diff_index"
          :key="diff_flag"
          :options="
            chart.diffs.map((v, i) => {
              return { key: v.name, val: i }
            })
          "
        />
        <label>{{ toTimeStr(currentTimeRef) }}/{{ toTimeStr(chart.length / 1000) }}</label>
        <input
          v-model="currentTimeRef"
          :max="chart.length / 1000"
          min="0"
          step="0.1"
          type="range"
        />
        <label v-html="Language.fp.chart.rate + ':' + play_rate_ref + 'x'" />
        <input
          :value="play_rate_ref"
          max="2"
          min="0.5"
          step="0.1"
          type="range"
          @change="(e) => (play_rate_ref = Number((e.target as HTMLInputElement).value))"
        />
      </div>
      <div class="chart-other">
        <div class="add-diff-btn" @click="chart.createDiff" v-html="Language.fp.chart.create" />
        <div class="add-diff-btn" @click="chart.deleteDiff" v-html="Language.fp.chart.del"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  user-select: none;
}

.fp-wrapper {
  width: calc(90% - 700px);
  min-width: 700px;
  height: 100%;
  left: 700px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.fp-wrapper > div {
  width: 90%;
  margin: 20px 30px;
  box-shadow: #0d1418 0 0 10px;
  background-color: #0d1418aa;
  padding: 10px;
}

.fp-wrapper > div > .fp-title {
  line-height: 2rem;
  font-size: 1.3rem;
  width: 100%;
  border-bottom: 2px solid #8d8d8d;
  margin-bottom: 10px;
}

.mode-set {
  display: grid;
  padding: 5px;
  grid-template-columns: 1fr 3fr 1fr;
  text-align: center;
  justify-items: center;
  width: 100%;
}

.notes {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 10px;
  margin-bottom: 15px;
}

.notes > div {
  display: grid;
  grid-template-rows: 43px 1fr;
  gap: 5px;
  justify-items: center;
  padding: 5px;
  background-color: #66666666;
  cursor: pointer;
  transition: all 0.2s linear;
}

.notes > div.note-chosen {
  background-color: #8d8d8d;
}

.notes > div > img {
  height: 100%;
}

.notes > div > div {
  display: grid;
  grid-template-columns: 1fr 2fr;
  justify-items: center;
  align-items: center;
  width: 100%;
}

.note-setting {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

input[type='range'] {
  width: 80%;
}

input[type='number'] {
  background-color: transparent;
  border: none;
  width: 70%;
  text-align: center;
  outline: none;
  height: 100%;
  font-size: 1rem;
}

.chart-other {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
  justify-content: center;
}

.chart-other > div {
  flex-basis: 200px;
}

.add-diff-btn {
  cursor: pointer;
  background-color: #444;
  margin: 5px;
  line-height: 1.5rem;
  text-align: center;
}

.chart-settings {
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-template-rows: 1fr 1fr;
  gap: 15px 0;
}

.chart-settings > input {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
  border-bottom: 1px solid transparent;
}
.chart-settings > input:focus {
  border-bottom: 1px solid var(--grey);
}

.chart-settings > select {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
}

.chart-settings > option {
  background-color: transparent;
  border-radius: 0;
  appearance: none;
  color: black;
}

.chart-settings > * {
  text-align: center;
}

option {
  color: black;
  background-color: transparent;
  line-height: 1.3rem;
  font-size: 1rem;
}
</style>
