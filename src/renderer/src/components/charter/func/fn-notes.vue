<script setup lang="ts">
import ui from '@renderer/core/ui'
import { watch } from 'vue'
import Translations from '@renderer/core/translations'

const setting = ui.charter.settings
const { note_type, scale, meter, middle } = setting
const Language = Translations

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
</script>

<template>
  <div class="fp-unit">
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
</template>

<style scoped>
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
</style>
