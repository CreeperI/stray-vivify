<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import { Charter } from '@renderer/core/charter'
import AButton from '@renderer/components/a-elements/a-button.vue'
import { Settings } from '@renderer/core/Settings'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import SettingHeader from '@renderer/components/modals/setting-header.vue'

const r = Settings.data
</script>

<template>
  <SimpleModal title="设置" size="sm">
    <div class="settings-wrapper">
      <div style="width: 100%; text-align:center;">编辑数字可以使用键盘上下和滚轮哦。</div>
      <div class="contain">
        <setting-header msg="编辑器" />
        <div>
          <div>滚轮反转</div>
          <a-checkbox v-model="r.settings.reverse_scroll" />
        </div>
        <div>
          <s>显示timing</s>
          <a-checkbox v-model="r.settings.show_bottom_timing" />
        </div>
        <div>
          <div>显示底部#Timing</div>
          <a-checkbox v-model="r.settings.show_bpm_bottom" />
        </div>
        <div>
          <div>lane-width</div>
          <a-number-input class="in" min="1" v-model="r.settings.lane_width" />
        </div>
        <div>
          <div>offset1</div>
          <a-number-input class="in" v-model="r.settings.offset1" />
        </div>
        <setting-header msg="预览模式" />
        <div>
          <div>左侧显示小节数</div>
          <a-checkbox v-model="r.settings.record_field.show_bar_text" />
        </div>
        <div>
          <div>显示小节线</div>
          <a-checkbox v-model="r.settings.record_field.show_beat_line" />
        </div>
        <div>
          <div>左侧小节线下显示bpm</div>
          <a-checkbox v-model="r.settings.record_field.show_bpm_left" />
        </div>
        <div>
          <div>底部显示#timing</div>
          <a-checkbox v-model="r.settings.record_field.show_bpm_bottom" />
        </div>
        <div>
          <div>右侧信息密度</div>
          <a-number-input min="0" max="5" v-model="r.settings.record_field.detail" />
        </div>
      </div>
    </div>
    <template #footer>
      <a-button msg="快捷键设置" @click="Charter.modal.ShortcutModal.show({})" />
      <a-button msg="Credits" @click="Charter.modal.CreditsModal.show({})" />
    </template>
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
  align-items: center;
}

.contain {
  width: 80%;
}
.contain > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.contain > div > *:first-child {
  text-align: center;
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
.in ::-webkit-inner-spin-button,
.in ::-webkit-outer-spin-button {
  appearance: none;
}
</style>
