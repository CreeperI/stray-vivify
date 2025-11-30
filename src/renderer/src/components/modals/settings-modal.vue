<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import AButton from '@renderer/components/a-elements/a-button.vue'
import { Settings } from '@renderer/core/settings'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import SettingHeader from '@renderer/components/modals/setting-header.vue'
import AColorInput from '@renderer/components/a-elements/a-color-input.vue'
import { modal } from '@renderer/core/modal'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Invoke } from '@renderer/core/ipc'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'

const r = Settings.settings
</script>

<template>
  <SimpleModal size="1" title="设置">
    <div class="settings-wrapper">
      <div style="width: 100%; text-align: center">编辑数字可以使用键盘上下和滚轮哦。</div>
      <div class="contain">
        <setting-header msg="欢迎来到stray-vivify！" />
        <div>
          <word-helper dec="会帮你自动填到谱师栏" msg="设定一个名字吧！"/>
          <a-text-input v-model="r.username" />
        </div>
        <setting-header msg="编辑器" />
        <div>
          <div>滚轮反转</div>
          <a-checkbox v-model="r.settings.reverse_scroll" />
        </div>
        <div>
          <div>显示底部#Timing黑字</div>
          <a-checkbox v-model="r.settings.show_bpm_bottom" />
        </div>
        <div>
          <div>右侧分音</div>
          <a-checkbox v-model="r.settings.show_ticks" />
        </div>
        <div>
          <div>跳过删除确认</div>
          <a-checkbox v-model="r.settings.delete_no_confirm" />
        </div>
        <div>
          <div>lane-width (px)</div>
          <a-number-input v-model="r.settings.lane_width" class="in" min="1" />
        </div>
        <div>
          <div>延迟（视觉）</div>
          <a-number-input v-model="r.settings.offset1" class="in" />
        </div>
        <div>
          <word-helper dec="密度折线的采样数，也即折线的数据点数" msg="密度采样间隔" />
          <a-number-input v-model="r.settings.density_data_count" class="in" min="10" />
        </div>
        <div>
          <word-helper dec="仿照malody，不使用小节来标注，而是每一个四分音符（按timing设置）标一个。勾选这个=启用malody。" msg="小节号或拍号" />
          <a-checkbox v-model="r.settings.bar_or_section" />
        </div>
        <div>
          <word-helper dec="摆放note时，会自动对齐至已存在的最近(+-本数值ms)的note的时间" msg="note吸附范围" />
          <a-number-input v-model="r.settings.nearest" />
        </div>
        <div>
          <div>Auto Save</div>
          <a-checkbox v-model="r.settings.auto_save" />
        </div>
        <div>
          <div>Stats面板</div>
          <a-checkbox v-model="r.settings.star_rating" />
        </div>
        <setting-header msg="note分组"  />
        <div>
          <div>向后ms</div>
          <a-number-input v-model="r.settings.pooling.ahead" class="in" />
        </div>
        <div>
          <div>向前ms</div>
          <a-number-input v-model="r.settings.pooling.behind" class="in" />
        </div>
        <div>
          <div>最小pooling间隔</div>
          <a-number-input v-model="r.settings.pooling.interval" min="16" />
        </div>
        <div>
          <div>最大note数</div>
          <a-number-input v-model="r.settings.pooling.count" min="20" />
        </div>
        <setting-header msg="打击音" />
        <div>
          <div>打击音</div>
          <a-checkbox v-model="r.settings.hit_sound" />
        </div>
        <div>
          <div>打击音延迟</div>
          <a-number-input v-model="r.settings.offset3" class="in" />
        </div>
        <div>
          <div>打击音音量</div>
          <a-number-input v-model="r.settings.hit_volume" class="in" max="100" min="0" step="1"/>
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
          <div>球ticks</div>
          <a-checkbox v-model="r.settings.record_field.show_circles" />
        </div>
        <div>
          <div>右侧信息密度</div>
          <a-number-input v-model="r.settings.record_field.detail" max="5" min="0" />
        </div>
        <setting-header msg="SV编辑" />
        <div>
          <div>显示小节线</div>
          <a-checkbox v-model="r.settings.sv.show_beat_line" />
        </div>
        <div>
          <div>小节线透明度</div>
          <a-number-input v-model="r.settings.sv.beat_line_opacity" max="100" min="0" step="1" />
        </div>
        <div>
          <div>小节线宽度</div>
          <a-number-input v-model="r.settings.sv.beat_line_width" min="0" step="1" />
        </div>
        <div>
          <div>时间指针宽度</div>
          <a-number-input v-model="r.settings.sv.pointer_width" min="0" step="1" />
        </div>
        <div>
          <div>时间指针颜色</div>
          <a-color-input v-model="r.settings.sv.pointer_color" />
        </div>
        <div>
          <div>lane_width</div>
          <a-number-input v-model="r.settings.sv.lane_width" min="0" step="1" />
        </div>
        <div>
          <div>lane_width2</div>
          <a-number-input v-model="r.settings.sv.lane_width2" min="0" step="1" />
        </div>
        <div>
          <div>Factory颜色</div>
          <a-color-input v-model="r.settings.sv.factory_color" />
        </div>
        <div>
          <div>Factory不透明度</div>
          <a-number-input v-model="r.settings.sv.factory_opacity" max="100" min="0" step="1" />
        </div>
        <setting-header msg="小节线" />
        <div>
          <div>小节线颜色 1</div>
          <a-color-input v-model="r.settings.sprites.bar_color1" />
        </div>
        <div>
          <div>小节线颜色 4</div>
          <a-color-input v-model="r.settings.sprites.bar_color2" />
        </div>
        <div>
          <div>小节线颜色 8</div>
          <a-color-input v-model="r.settings.sprites.bar_color3" />
        </div>
        <div>
          <div>小节线颜色 16</div>
          <a-color-input v-model="r.settings.sprites.bar_color4" />
        </div>
        <div>
          <div>小节线颜色 32</div>
          <a-color-input v-model="r.settings.sprites.bar_color5" />
        </div>

        <div>
          <div>小节线<b class="rainbow-text-color">不</b>透明度</div>
          <a-number-input v-model="r.settings.sprites.bar_op" max="100" min="0" step="1" />
        </div>
        <div>
          <div>小节线宽度</div>
          <a-number-input v-model="r.settings.sprites.bar_length" min="0" />
        </div>
        <div>
          <div>小节线偏移</div>
          <a-number-input v-model="r.settings.sprites.bar_dy"/>
        </div>
        <setting-header msg="游玩" />
        <div>
          <div>Pure</div>
          <a-number-input v-model="r.settings.judgement.p1" min="0" />
        </div>
        <div>
          <div>Perfect</div>
          <a-number-input v-model="r.settings.judgement.p2" min="0" />
        </div>
        <div>
          <div>Great</div>
          <a-number-input v-model="r.settings.judgement.p3" min="0" />
        </div>
        <div>
          <div>Good</div>
          <a-number-input v-model="r.settings.judgement.p4" min="0" />
        </div>
        <div>
          <div>Bomb</div>
          <a-number-input v-model="r.settings.judgement.p5" min="0" />
        </div>
        <div>
          <div>延迟（游玩）</div>
          <a-number-input v-model="r.settings.offset2" class="in" />
        </div>
        <div>
          <div>延迟（视觉）</div>
          <a-number-input v-model="r.settings.offset3" class="in" />
        </div>
        <setting-header msg="导出：Custom Song" />
        <div>
          <div>剪裁图片</div>
          <a-checkbox v-model="r.settings.exporter.crop" />
        </div>
        <div>
          <div>导出stray/vivify文件
          </div>
          <a-checkbox v-model="r.settings.exporter.sv" />
        </div>
        <setting-header msg="debug"/>
        <div>
          <div>Mouse Tracker</div>
          <a-checkbox v-model="r.settings.mouse_tracker" />
        </div>
        <div>
          <div>Debug Widget</div>
          <a-checkbox v-model="r.settings.debug_window" />
        </div>
      </div>
    </div>
    <template #footer>
      <a-button msg="DevTools" @click="Invoke('open-dev')" />
      <a-button msg="Inspector" @click="modal.InspectorModal.show({})" />
      <a-button msg="快捷键设置" @click="modal.ShortcutModal.show({})" />
      <a-button msg="<strong>信用</strong>" @click="modal.CreditsModal.show({})" />
    </template>
  </SimpleModal>
</template>

<style scoped>
.settings-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 60vh;
  overflow: hidden scroll;
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
