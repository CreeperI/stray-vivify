<script lang="ts" setup>
import ModalBase from '@renderer/components/modals/modalBase.vue'
import settings from '@renderer/core/settings'
import Translations, { Languages } from '@renderer/core/translations'
import ASelect from '@renderer/components/a-select.vue'

const Language = Translations.current
</script>

<template>
  <modal-base>
    <template #header><span v-html="Language.settings.title"></span></template>
    <div class="settings-wrapper">
      <label>
        <span v-html="Language.settings.language + Language.settings.after_reboot"></span>
        <a-select
          v-model="settings.lang"
          :options="
            Languages.map((x) => {
              return { key: x, val: x }
            })
          "
        />
      </label>
    </div>
  </modal-base>
</template>

<style scoped>
.settings-wrapper {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
