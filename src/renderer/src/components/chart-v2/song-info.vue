<script setup lang="ts">


import { Charter } from '@renderer/core/charter'
import SongInfoSingle from '@renderer/components/chart-v2/song-info-single.vue'

const {name, name_roman, composer_roman, ref, composer, bpm, source} = Charter.get_chart().song.refs
</script>

<template>
  <div class="info-wrapper">
    <div class="info-inner">
      <song-info-single name="曲名" v-model="name" />
      <song-info-single name="曲名-罗马音" v-model="name_roman" />
      <song-info-single name="编曲" v-model="composer" />
      <song-info-single name="编曲-罗马音" v-model="composer_roman" />
      <song-info-single name="BPM" v-model="bpm" />
      <song-info-single name="来源" v-model="source" />
      <song-info-single name="注释" v-model="ref" />
    </div>
  </div>
</template>

<style scoped>
.info-wrapper {
  width: 100%;
  height: 100%;
}
.info-inner {
  width: 80%;
  margin: 10%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 15px;
  gap: 10px;
}
.info-inner > div {
  flex-basis: 45%;
}
</style>
