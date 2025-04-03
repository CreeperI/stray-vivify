<script lang="ts" setup>
import { Charter } from '@renderer/core/charter'
import Translations from '@renderer/core/translations'

const data = Charter.load_state.data

function waht(s: 'pending' | 'success' | 'failed') {
  if (s == 'pending') return '???'
  if (s == 'success') return '✔'
  return '❌'
}
</script>

<template>
  <div class="waiting-wrapper">
    <div class="waiting-container">
      <div class="waiting-state">
        <div v-html="Translations.load_state.ask_path" />
        <div v-html="waht(data.asked_path)" />
        <div v-html="Translations.load_state.load_music_from_backend" />
        <div v-html="waht(data.load_music_from_backend)" />
        <div v-html="Translations.load_state.create_music_blob" />
        <div v-html="waht(data.create_music_blob)" />
        <div v-html="Translations.load_state.waiting_can_play" />
        <div v-html="waht(data.waiting_can_play)" />
      </div>
      <div class="waiting-tips">
        <div
          v-if="data.asked_path != 'success'"
          v-html="Translations.load_state.stuck_at.ask_path"
        />
        <div
          v-if="data.load_music_from_backend != 'success'"
          v-html="Translations.load_state.stuck_at.load_music_from_backend"
        />
        <div
          v-if="data.create_music_blob != 'success'"
          v-html="Translations.load_state.stuck_at.create_music_blob"
        />
        <div
          v-if="data.waiting_can_play != 'success'"
          v-html="Translations.load_state.stuck_at.waiting_can_play"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.waiting-wrapper {
  position: relative;
  height: 70%;
  top: 10%;
  display: flex;
  width: 80%;
  left: 10%;
}

.waiting-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
}

.waiting-state {
  display: grid;
  grid-template-columns: 2fr 1fr;
  font-size: 1.1rem;
  gap: 10px;
  text-align: left;
  align-self: center;
}

.waiting-tips {
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
