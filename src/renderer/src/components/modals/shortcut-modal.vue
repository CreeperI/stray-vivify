<script setup lang="ts">
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import ShortcutModalSingle from '@renderer/components/modals/shortcut-modal-single.vue'
import { ShortCuts } from '@renderer/core/shortcut'
import ShortcutModalHeader from '@renderer/components/modals/shortcut-modal-header.vue'
</script>

<template>
  <SimpleModal size="sm" title="快捷键设置">
    <div style="text-align: center">点击右侧的键位以输入</div>
    <table class="sc-table">
      <tbody>
        <shortcut-modal-header msg="切换宽度" />
        <shortcut-modal-single msg="1宽" :short="ShortCuts.$fun('w1')" />
        <shortcut-modal-single msg="2宽" :short="ShortCuts.$fun('w2')" />
        <shortcut-modal-single msg="3宽" :short="ShortCuts.$fun('w3')" />
        <shortcut-modal-single msg="4宽" :short="ShortCuts.$fun('w4')" />

        <shortcut-modal-header msg="切换类型" />
        <shortcut-modal-single msg="地雷" :short="ShortCuts.$fun('mine')" />
        <shortcut-modal-single msg="s" :short="ShortCuts.$fun('s')" />
        <shortcut-modal-single msg="面" :short="ShortCuts.$fun('hold')" />

        <shortcut-modal-header msg="不知道叫什么" />
        <shortcut-modal-single msg="撤销" :short="ShortCuts.$fun('undo')" />
        <shortcut-modal-single msg="重做" :short="ShortCuts.$fun('redo')" />
      </tbody>
    </table>
  </SimpleModal>
</template>

<style scoped>
.sc-table {
  width: 100%;
  text-align: center;
  margin-top: 15px;
}
</style>
