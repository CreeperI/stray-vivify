import type { Languages } from '@renderer/core/translations'
import { reactive, toRefs } from 'vue'
import { ChartType } from '@preload/types'

export const storage_settings = reactive({
  lang: '简中' as Languages,
  note_type: 'n' as ChartType.note['n'] | '',
  scale: 10,
  /* 拍号 分音 */
  meter: 4,
  middle: false,
  charter_layout: 'auto' as 'auto' | 'middle' | 'left',
  volume: 80,
  overlap_minimum: 20,
  reverse_scroll: false
})

const settings = toRefs(storage_settings)

export default settings
