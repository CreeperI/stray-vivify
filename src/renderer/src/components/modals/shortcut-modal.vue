<script setup lang="ts">
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import Translations from '@renderer/core/translations'
import ShortcutModalSingle from '@renderer/components/modals/shortcut-modal-single.vue'
import { ShortCuts } from '@renderer/core/shortcut'
</script>

<template>
  <SimpleModal size="sm" title="快捷键设置">
    <table>
      <tbody>
        <shortcut-modal-single
          :msg="Translations.charter_func.note.chip"
          :short="ShortCuts.$fun('note')"
        />
        <shortcut-modal-single
          :msg="Translations.charter_func.note.bumper"
          :short="ShortCuts.$fun('bumper')"
        />
        <shortcut-modal-single
          :msg="Translations.charter_func.note.mine"
          :short="ShortCuts.$fun('mine')"
        />
        <shortcut-modal-single
          :msg="Translations.charter_func.note.mb"
          :short="ShortCuts.$fun('mine-bumper')"
        />
        <shortcut-modal-single
          :msg="Translations.charter_func.note.hold"
          :short="ShortCuts.$fun('hold')"
        />
        <shortcut-modal-single
          :msg="Translations.charter_func.note.sb"
          :short="ShortCuts.$fun('s-bumper')"
        />
        <shortcut-modal-single
          :msg="Translations.charter_func.undo"
          :short="ShortCuts.$fun('undo')"
        />
        <shortcut-modal-single
          :msg="Translations.charter_func.redo"
          :short="ShortCuts.$fun('redo')"
        />
        <shortcut-modal-single
          msg="暂停"
          :short="ShortCuts.$fun('pause')"
        />
      </tbody>
    </table>
  </SimpleModal>
</template>

<style scoped></style>
