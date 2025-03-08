<script setup lang="ts">

import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import Translations from '@renderer/core/translations'
import ALabel from '@renderer/components/a-elements/a-label.vue'
import { Charter } from '@renderer/core/charter'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
const {show_bar_line,show_bar_count,show_bpm} = Charter.record
</script>

<template>
  <SimpleModal size="sm" :title="Translations.header.record.setting">
    <a-label :label="Translations.settings.record.show_bar_line" >
      <a-checkbox v-model="show_bar_line" />
    </a-label>
    <a-label :label="Translations.settings.record.show_bar_count" >
      <a-checkbox v-model="show_bar_count" />
    </a-label>
    <a-label :label="Translations.settings.record.show_bpm" >
      <a-checkbox v-model="show_bpm" />
    </a-label>
  </SimpleModal>
</template>

<style scoped>

</style>
