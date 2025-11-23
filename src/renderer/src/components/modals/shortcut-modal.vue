<script setup lang="ts">
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import ShortcutModalSingle from '@renderer/components/modals/shortcut-modal-single.vue'
import { ShortCuts } from '@renderer/core/shortcut'
import ShortcutModalHeader from '@renderer/components/modals/shortcut-modal-header.vue'
</script>

<template>
  <SimpleModal size="1" title="快捷键设置">
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

        <shortcut-modal-header msg="CTRL家族" />
        <shortcut-modal-single msg="撤销" :short="ShortCuts.$fun('undo')" />
        <shortcut-modal-single msg="重做" :short="ShortCuts.$fun('redo')" />
        <shortcut-modal-single msg="复制" :short="ShortCuts.$fun('copy')" />
        <shortcut-modal-single msg="剪切" :short="ShortCuts.$fun('cut')"/>
        <shortcut-modal-single msg="粘贴" :short="ShortCuts.$fun('paste')"/>
        <shortcut-modal-single msg="保存" :short="ShortCuts.$fun('save')"/>

        <shortcut-modal-header msg="Modals"/>
        <shortcut-modal-single msg="Inspector" :short="ShortCuts.$fun('log')"/>
        <shortcut-modal-single msg="Settings" :short="ShortCuts.$fun('settings')"/>
        <shortcut-modal-single msg="导入导出" :short="ShortCuts.$fun('iexport')"/>

        <shortcut-modal-header msg="键位" />
        <shortcut-modal-single msg="4k-1" :short="ShortCuts.$fun('4k1')" />
        <shortcut-modal-single msg="4k-2" :short="ShortCuts.$fun('4k2')" />
        <shortcut-modal-single msg="4k-3" :short="ShortCuts.$fun('4k3')" />
        <shortcut-modal-single msg="4k-4" :short="ShortCuts.$fun('4k4')" />
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
