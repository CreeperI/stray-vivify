import type { Languages } from '@renderer/core/translations'
import { ref } from 'vue'
import { ChartType } from '@preload/types'

export default {
  lang: '简中' as Languages,
  get language() {
    return this.lang
  },
  set language(v: Languages) {
    this.lang = v
  },
  note_type: ref<ChartType.note['n'] | ''>(''),
  scale: ref(10),
  /* 拍号 分音 */
  meter: ref(4),
  middle: ref(false)
}
