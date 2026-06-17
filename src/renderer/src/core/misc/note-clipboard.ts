import { ChartTypeV2 } from '@preload/chart-types'
import { ref } from 'vue'

export const NoteClipboard = {
  selected: [] as ChartTypeV2.note[],
  clipboard: ref<ChartTypeV2.note[]>([]),
  clear() {
    this.clipboard.value = []
    this.selected = []
  },
  copy: () => {},
  cut: () => {},
  paste: () => {}
}
