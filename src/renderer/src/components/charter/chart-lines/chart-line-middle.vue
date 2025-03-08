<script setup lang="ts">

import FnNotes from '@renderer/components/charter/func/fn-notes.vue'
import FnCharter from '@renderer/components/charter/func/fn-charter.vue'
import Lane from '@renderer/components/charter/lane.vue'
import FnSong from '@renderer/components/charter/func/fn-song.vue'
import FnCounts from '@renderer/components/charter/func/fn-counts.vue'
</script>

<template>
  <div class="fp-wrapper">
    <fn-charter />
    <fn-notes />
  </div>
  <Lane />
  <div class="fp-wrapper">
    <fn-song />
    <fn-counts />
  </div>
</template>

<style scoped>

</style>
