<script setup lang="ts">
import { computed } from 'vue'
import { Settings } from '@renderer/core/Settings'
import { ChartTypeV2 } from '@preload/types'

const style_prefix = 'stray:/__skin__/'
const set = Settings.data
const note_type = computed(() => set.value.settings.note_type)

function note_choice(n: ChartTypeV2.note['n']) {
  Settings.note_choice(n)
}
</script>

<template>
  <div class="fn-left">
    <div class="notes">
      <div :class="note_type == 'n' ? 'note-chosen' : ''" @click="note_choice('n')">
        <img alt="Note.png" :src="style_prefix + 'noteL.png'" />
      </div>
      <div :class="note_type == 'b' ? 'note-chosen' : ''" @click="note_choice('b')">
        <img alt="Bumper.png" :src="style_prefix + 'bL.png'" />
      </div>
      <div :class="note_type == 'm' ? 'note-chosen' : ''" @click="note_choice('m')">
        <img alt="Note.mine.png" :src="style_prefix + 'bomb.png'" />
      </div>
      <div :class="note_type == 'mb' ? 'note-chosen' : ''" @click="note_choice('mb')">
        <img alt="Bumper.mine.png" :src="style_prefix + 'bB.png'" />
      </div>
      <div :class="note_type == 'h' ? 'note-chosen' : ''" @click="note_choice('h')">
        <img alt="Note.png" :src="style_prefix + 'noteL.png'" />
      </div>
      <div :class="note_type == 's' ? 'note-chosen' : ''" @click="note_choice('s')">
        <img alt="Bumper.png" :src="style_prefix + 'sbL.png'" />
      </div>
      <div :class="note_type == 'f' ? 'note-chosen' : ''" @click="note_choice('f')">
        <img alt="Bumper.png" :src="style_prefix + 'f.png'" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fn-left {
  display: flex;
  flex-direction: column;
  flex: 1 1 320px;
}

.notes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.notes > div {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  background-color: #66666666;
  cursor: pointer;
  transition: all 0.2s linear;
  max-width: 250px;
}

.notes > div.note-chosen {
  background-color: #8d8d8d;
}

.notes > div > img {
  max-width: 270px;
}

.notes > div > div {
  display: grid;
  grid-template-columns: 1fr 2fr;
  justify-items: center;
  align-items: center;
  width: 100%;
}
</style>
