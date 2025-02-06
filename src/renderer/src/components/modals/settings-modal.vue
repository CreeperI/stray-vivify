<script lang="ts" setup>
import settings from '@renderer/core/settings'
import Translations, { Languages } from '@renderer/core/translations'
import ASelect from '@renderer/components/a-elements/a-select.vue'
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import ALabel from '@renderer/components/a-elements/a-label.vue'

const Language = Translations
const { lang, charter_layout } = settings
const pos_options = [
  { key: Language.settings.layout.auto, val: 'auto' },
  { key: Language.settings.layout.middle, val: 'middle' },
  { key: Language.settings.layout.left, val: 'left' }
]
</script>

<template>
  <SimpleModal :title="Language.settings.title" size="sm">
    <div class="settings-wrapper">
      <a-label :label="Language.settings.language + Language.settings.after_reboot">
        <a-select
          v-model="lang"
          :options="
            Languages.map((x) => {
              return { key: x, val: x }
            })
          "
        />
      </a-label>
      <a-label :label="Language.settings.layout.layout">
        <a-select v-model="charter_layout" :options="pos_options"></a-select>
      </a-label>
    </div>

    <template #footer> /a b30</template>
  </SimpleModal>
</template>

<style scoped>
.settings-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
}

select {
  width: 80%;
  border: none;
  outline: none;
  background-color: transparent;
  text-align: center;
  line-height: 1.3rem;
  font-size: 1rem;
}

option {
  color: black;
}
</style>
