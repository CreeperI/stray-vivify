<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import AButton from '@renderer/components/a-elements/a-button.vue'
import { Storage } from '@renderer/core/storage'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import SettingHeader from '@renderer/components/modals/setting-header.vue'
import AColorInput from '@renderer/components/a-elements/a-color-input.vue'
import { modal } from '@renderer/core/misc/modal'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Invoke } from '@renderer/core/ipc'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'

const r = Storage._ref
</script>

<template>
  <SimpleModal size="1" title="设置">
    <div class="settings-wrapper">
      <div style="width: 100%; text-align: center">编辑数字可以使用键盘上下和滚轮哦。</div>
      <div class="contain">
        <setting-header msg="欢迎来到stray-vivify！" />
        <div>
          <word-helper dec="会帮你自动填到谱师栏" msg="设定一个名字吧！" />
          <a-text-input v-model="r.username" />
        </div>
        <div>
          <div>显示stray/vivify图标</div>
          <a-checkbox v-model="r.settings.stray_logo" />
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
          <word-helper
            dec="仿照malody，不使用小节来标注，而是每一个四分音符（按timing设置）标一个。<br>勾选这个=启用beat。"
            msg="小节号或拍号"
          />
          <a-checkbox v-model="r.settings.bar_or_section" />
        </div>
        <div>
          <div>
            <word-helper dec="在启用Beat的时候自动开启。">显示Beat时间</word-helper>
          </div>
          <a-checkbox v-model="r.settings.beat_fn_time" class="in" />
        </div>
        <div>
          <div>Beat从0开始</div>
          <a-checkbox v-model="r.settings.bar_from_0" />
        </div>
        <div>
          <word-helper
            dec="摆放note时，会自动对齐至已存在的最近(+-本数值ms)的note的时间"
            msg="note吸附范围"
          />
          <a-number-input v-model="r.settings.nearest" />
        </div>
        <div>
          <div class="rainbow-text-flow" style="font-size: 2rem; font-weight: bold">自动保存</div>
          <a-checkbox v-model="r.settings.auto_save" />
        </div>
        <div>
          <div>Stats面板</div>
          <a-checkbox v-model="r.settings.star_rating" />
        </div>
        <div>
          <div>彩色Stats</div>
          <a-checkbox v-model="r.settings.color_stats" />
        </div>
        <div>
          <div>显示Version</div>
          <a-checkbox v-model="r.settings.always_version" />
        </div>

        <setting-header msg="note分组" />
        <div>
          <div>向后ms</div>
          <a-number-input v-model="r.settings.pooling.ahead" class="in" />
        </div>
        <div>
          <s>向前ms</s>
          <a-number-input v-model="r.settings.pooling.behind" class="in" disabled />
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
          <a-number-input v-model="r.settings.hit_volume" class="in" max="100" min="0" step="1" />
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
          <div>mod按照名字排序</div>
          <a-checkbox v-model="r.settings.sv.sort_by_name" />
        </div>
        <div>
          <div>简化obj名</div>
          <a-checkbox v-model="r.settings.sv.short_obj" />
        </div>
        <div>
          <div>note不透明度</div>
          <a-number-input v-model="r.settings.sv.opacity" max="100" min="0" />
        </div>
        <div>
          <div>lane width</div>
          <a-number-input v-model="r.settings.sv.lane_width" min="20" />
        </div>
        <div>
          <div>指示线宽度</div>
          <a-number-input v-model="r.settings.sv.pending_width" min="1" />
        </div>
        <div>
          <div>指示线颜色</div>
          <a-color-input v-model="r.settings.sv.pending_stroke" />
        </div>
        <div>
          <div>指示线不透明度</div>
          <a-number-input v-model="r.settings.sv.pending_opacity" max="100" min="0" />
        </div>
        <div>
          <div>右侧拓展宽度</div>
          <a-number-input v-model="r.settings.sv.expand_width" />
        </div>
        <div>
          <div>颜色：单次mod</div>
          <a-color-input v-model="r.settings.sv.color_single" />
        </div>
        <div>
          <div>颜色：重复mod-背景</div>
          <a-color-input v-model="r.settings.sv.color_repeat_bg" />
        </div>
        <div>
          <div>颜色：重复mod-前条</div>
          <a-color-input v-model="r.settings.sv.color_repeat_fg" />
        </div>
        <div>
          <div>颜色：新mod-单次</div>
          <a-color-input v-model="r.settings.sv.color_pending_single" />
        </div>
        <div>
          <div>颜色：新mod-重复</div>
          <a-color-input v-model="r.settings.sv.color_pending_repeat" />
        </div>
        <div>
          <div>颜色：mod文字</div>
          <a-color-input v-model="r.settings.sv.color_text" />
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
          <div>小节线颜色 48</div>
          <a-color-input v-model="r.settings.sprites.bar_color6" />
        </div>
        <div>
          <div>小节线颜色 64</div>
          <a-color-input v-model="r.settings.sprites.bar_color7" />
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
          <a-number-input v-model="r.settings.sprites.bar_dy" />
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
          <div>导出stray/vivify文件</div>
          <a-checkbox v-model="r.settings.exporter.sv" />
        </div>
        <setting-header msg="debug" />
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
      <a-button msg="查看Version" @click="modal.VersionsModal.show({})" />
      <a-button msg="Inspector" @click="modal.InspectorModal.show({})" />
      <a-button msg="快捷键设置" @click="modal.ShortcutModal.show({})" />
      <a-button msg="Credits" @click="modal.CreditsModal.show({})" />
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
