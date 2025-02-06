<script lang="ts" setup>
import Lane from '@renderer/components/charter/lane.vue'
import FnNotes from '@renderer/components/charter/func/fn-notes.vue'
import FnSong from '@renderer/components/charter/func/fn-song.vue'
import FnCharter from '@renderer/components/charter/func/fn-charter.vue'
import ui from '@renderer/core/ui'
import settings from '@renderer/core/settings'

const charter_layout = settings.charter_layout

const w = ui.windowWidth
</script>

<template>
  <div class="charter-wrapper">
    <div
      v-if="(charter_layout == 'auto' && w > 1600) || charter_layout == 'middle'"
      class="fp-wrapper"
    >
      <fn-charter />
      <fn-notes />
    </div>
    <Lane />
    <div class="fp-wrapper">
      <template v-if="(charter_layout == 'auto' && w < 1600) || charter_layout == 'left'">
        <fn-charter />
        <fn-notes />
      </template>
      <fn-song />
    </div>
  </div>
</template>

<style scoped>
.charter-wrapper {
  width: 100%;
  height: calc(100% - var(--height-header));
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

* {
  user-select: none;
}

.fp-wrapper {
  width: calc(100% - 40px);
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}
</style>
<style>
.fp-unit {
  width: calc(100% - 40px);
  margin: 10px;
  box-shadow: #0d1418 0 0 10px;
  background: var(--dark-bgi);
  padding: 10px;

  * {
    user-select: none;
  }

  .fp-title {
    line-height: 2rem;
    font-size: 1.3rem;
    width: 100%;
    border-bottom: 2px solid #8d8d8d;
    margin-bottom: 10px;
  }
}
</style>
