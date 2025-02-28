<script lang="ts" setup>
import settings from '@renderer/core/settings'
import Translations, { Languages } from '@renderer/core/translations'
import ASelect from '@renderer/components/a-elements/a-select.vue'
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import ALabel from '@renderer/components/a-elements/a-label.vue'
import { computed, ref } from 'vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'

const Language = Translations
const { lang, charter_layout, overlap_minimum, reverse_scroll } = settings
const pos_options = [
  { key: Language.settings.layout.auto, val: 'auto' },
  { key: Language.settings.layout.middle, val: 'middle' },
  { key: Language.settings.layout.left, val: 'left' }
]
const active = ref(0)
const ia = (n: number) => computed(() => active.value == n ? 'active-tab' : '')
</script>

<template>
  <SimpleModal :title="Language.settings.title" size="sm">
    <div class="settings-wrapper">
      <div class="setting-list">
        <div @click="active = 0" :class="ia(0).value">111</div>
        <div @click="active = 1" :class="ia(1).value">222</div>
      </div>
      <div class="contain" v-if="active == 0">
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
      <div class="contain" v-if="active == 1">
        <a-label :label="Language.settings.reverse_scroll">
          <a-checkbox v-model="reverse_scroll"/>
        </a-label>
        <a-label :label="Language.settings.overlap_minimum">
          <a-number-input v-model="overlap_minimum" />
        </a-label>
      </div>
    </div>
    <template #footer> /a b30</template>
  </SimpleModal>
</template>

<style scoped>
.setting-list {
  display: flex;
  flex-basis: 1.8rem;
  margin-bottom: 10px;
}

.setting-list > div {
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s linear;
  user-select: none;
  width: 70px;
  text-align: center;
  padding: 0;
}

.active-tab {
  border-bottom-color: #b8dcee !important;
}

.settings-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.contain {
  display: grid;
  grid-template-columns: 1fr;
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
