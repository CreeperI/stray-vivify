<script setup lang="ts">
import { computed, ComputedRef } from 'vue'
import { Settings } from '@renderer/core/Settings'
import { ChartTypeV2 } from '@preload/types'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import NoteV2 from '@renderer/components/chart-v2/note-v2.vue'

const { width, s, hold, b } = Settings.note

const pending_note = computed(() => {
  if (hold.value) {
    return {
      time: 0,
      lane: 0,
      width: width.value,
      ani: []
    }
  } else {
    return {
      time: 0,
      lane: 0,
      width: width.value,
      ani: [],
      snm: Settings.note.snm
    }
  }
}) as ComputedRef<ChartTypeV2.note>
</script>

<template>
  <div class="fn-wrapper">
    <div class="notes">
      <div class="note-width">
        <span>note宽</span>
        <div class="note-width-btn" :class="width == 1? 'chosen' : ''" @click="Settings.note.set_width(1)">1</div>
        <div class="note-width-btn" :class="width == 2? 'chosen' : ''" @click="Settings.note.set_width(2)">2</div>
        <div class="note-width-btn" :class="width == 3? 'chosen' : ''" @click="Settings.note.set_width(3)">3</div>
        <div class="note-width-btn" :class="width == 4? 'chosen' : ''" @click="Settings.note.set_width(4)">4</div>
      </div>
      <div class="note-snb">
        <s>S/B</s>
        <div>
          <a-checkbox v-model="s"></a-checkbox>
          S
        </div>
        <div>
          <a-checkbox v-model="b"></a-checkbox>
          B
        </div>
        <div>
          <a-checkbox v-model="hold"></a-checkbox>
          长条
        </div>
      </div>
      <div class="note-pending">
        <note-v2 :note="pending_note" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.notes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}
.note-width {
  display: grid;
  grid-template-columns: 2fr repeat(4, 1fr);
  gap: 5px;
}
.note-width > div,
.note-width > span,
.note-snb > div,
.note-snb > s {
  text-align: center;
  line-height: 1.5rem;
  height: 1.5rem;
}
.note-width > div {
  cursor: pointer;
  transition: background-color 0.2s;
}
.note-width > div:hover, .chosen{
  background: var(--button-hover);
}
.note-snb {
  display: grid;
  grid-template-columns: 3fr 2fr 2fr 2fr;
  gap: 5px;
}
.note-pending {
  display: flex;
  position: relative;
  justify-content: center;
}
.note-pending > img {
  position: relative;
  max-width: 90%;
}
</style>
