import type { Languages } from '@renderer/core/translations'
import { ref } from 'vue'
import { ChartType } from '@preload/types'

export default {
  lang: ref('简中' as Languages),
  note_type: ref<ChartType.note['n'] | ''>('n'),
  scale: ref(10),
  /* 拍号 分音 */
  meter: ref(4),
  middle: ref(false),
  charter_layout: ref("auto" as  "auto" | "middle" | "left")
}
