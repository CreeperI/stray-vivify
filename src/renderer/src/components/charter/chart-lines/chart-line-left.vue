<script lang="ts" setup>
import FnNotes from '@renderer/components/charter/func/fn-notes.vue'
import FnCharter from '@renderer/components/charter/func/fn-charter.vue'
import Lane from '@renderer/components/charter/lane.vue'
import FnSong from '@renderer/components/charter/func/fn-song.vue'
import { ref } from 'vue'
import Translations from '@renderer/core/translations'
import FnCounts from '@renderer/components/charter/func/fn-counts.vue'

const flag = ref(0)
</script>

<template>
  <Lane />
  <div class="left-wrapper">
    <div class="left-change">
      <div
        :class="flag == 0 ? 'chosen' : ''"
        @click="flag = 0"
        v-html="Translations.charter_func.left_header.chart"
      />
      <div
        :class="flag == 1 ? 'chosen' : ''"
        @click="flag = 1"
        v-html="Translations.charter_func.left_header.song"
      />
    </div>
    <div class="fp-wrapper">
      <fn-charter v-if="flag == 0" />
      <fn-notes   v-if="flag == 0" />
      <fn-song v-if="flag == 1" />
      <fn-counts v-if="flag == 1"/>
    </div>
  </div>
</template>

<style scoped>
.left-wrapper {
  width: 100%;
}

.left-change {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 5px;
  width: calc(100% - 20px);
  text-align: center;
  background-image: var(--dark-bgi);
}

.left-change > div {
  border-top: 2px transparent solid;
  border-bottom: 2px transparent solid;
  transition: all 0.2s linear;
  padding-bottom: 10px;
  padding-top: 5px;
}

.left-change > div:hover:not(.chosen) {
  border-bottom: 2px solid #a4bdba;
}

.chosen {
  border-bottom-color: #16ccae !important;
}
</style>
