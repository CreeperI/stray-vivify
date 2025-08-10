<script lang="ts" setup>
import { Charter } from '@renderer/core/charter'
import Translations from '@renderer/core/translations'

const chart = Charter.get_chart()
const counts = chart.diff.counts
</script>

<template>
  <div class="fp-unit">
    <div class="fp-title" v-html="Translations.charter_func.count.title" />
    <div class="counts-list">
      <div>
        <div>{{ Translations.charter_func.note.chip }}</div>
        <div>{{ counts.chip }}</div>
      </div>
      <div>
        <div>{{ Translations.charter_func.note.hold }}</div>
        <div>{{ counts.hold }}</div>
      </div>
      <div>
        <div>{{ Translations.charter_func.note.bumper }}</div>
        <div>{{ counts.bumper }}</div>
      </div>
      <div>
        <div>{{ Translations.charter_func.note.mine }}</div>
        <div>{{ counts.bomb }}</div>
      </div>
      <div>
        <div>{{ Translations.charter_func.note.mb }}</div>
        <div>{{ counts.bBumper }}</div>
      </div>
      <div>
        <div>{{ Translations.charter_func.note.sb }}</div>
        <div>{{ counts.sBumper }}</div>
      </div>
      <div>
        <div>{{Translations.charter_func.count.bpm}}</div>
        <div>{{ counts.bpm}}</div>
      </div>
      <div>
        <div>{{Translations.charter_func.count.avg_density}}</div>
        <div>{{ counts.avg_density.toPrecision(5)}}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.counts-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  align-items: center;
}

.counts-list > div {
  display: grid;
  grid-template-columns: 2fr 2fr;

  div:nth-child(1) {
    text-align: center;
  }

  div:nth-child(2) {
    text-align: left;
  }
}
</style>
