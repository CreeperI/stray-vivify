import { ChartType, Invoker } from '@preload/types'
import { computed, reactive, ref, watch } from 'vue'
import Translations, { LanguageData, Languages } from '@renderer/core/translations'
import { utils } from '@renderer/core/utils'
import { notify } from '@renderer/core/notify'
import { Chart } from '@renderer/core/chart'

const ipcRenderer = window.electron.ipcRenderer
const _invoke: Invoker = ipcRenderer.invoke

const Invoke = {
  get_file_buffer(path: string) {
    return _invoke('get-file-buffer', path)
  },
  read_vsb(path: string) {
    return _invoke('read-vsb', path)
  },
  ask_vsb() {
    return _invoke('ask-vsb')
  },
  save_chart(ch: ChartType.Chart, path: string) {
    return _invoke('save-chart', path, JSON.stringify(ch))
  },
  ask_song() {
    return _invoke('ask-song')
  },
  open_exist_chart(path: string) {
    return _invoke('open-exist-chart', path)
  },
  dev_tools() {
    return _invoke('dev-tools')
  },
  open_chart(path: string) {
    return _invoke('open-chart', path)
  }
}

const settings_function = (() => {
  const data = reactive({
    lang: 'zh_cn' as Languages,
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
  const fn = () => data
  fn.data = data

  fn.lang = (lang: any) => {
    if (lang in Languages) data.lang = lang
    else data.lang = 'zh_cn'
  }
  fn.note_type = (nt: any) => {
    if (['n', 'h', 's', 'mb', 'm', 'b'].includes(nt)) data.note_type = nt
    else data.note_type = nt
  }
  fn.scale = (scale: any) => {
    if (0 < scale && scale < 20) data.scale = scale
    else data.scale = 10
  }
  fn.meter = (meter: any) => {
    if (1 <= meter) data.meter = Math.floor(meter)
    else data.meter = 4
  }
  fn.middle = (middle: any) => {
    if (typeof middle == 'boolean') data.middle = middle
    else data.middle = false
  }
  fn.charter_layout = (layout: any) => {
    if (['middle', 'left', 'auto'].includes(layout)) data.charter_layout = layout
    else data.charter_layout = 'auto'
  }
  fn.volume = (vol: any) => {
    if (0 <= vol && vol <= 100) data.volume = vol
    else data.volume = 80
  }
  fn.overlap_minimum = (ov: any) => {
    if (0 < ov && ov < 100) data.overlap_minimum = ov
    else data.overlap_minimum = 20
  }
  fn.reverse_scroll = (rs: any) => {
    if (typeof rs == 'boolean') data.reverse_scroll = rs
    else data.reverse_scroll = false
  }
  return fn
})()

const refs = {
  window: {
    height: ref(window.outerHeight),
    width: ref(window.outerWidth),
  },
  mul: computed(() => settings_function.data.scale * 200 + 100)
}
const update = {
  flag: ref(114),
  update() {
    update.flag.value = Math.random()
  }
}

export const Charter = {
  invoke: Invoke,
  settings: settings_function,
  notify: notify,
  refs,
  update,
  get_chart() {
    if (Chart.current) return Chart.current
    throw new Error('No chart loaded.')
  }

}

watch(
  () => settings_function.data.lang,
  (v) => {
    utils.assign(Translations, LanguageData['zh_cn'])
    utils.assign(Translations, LanguageData[v])
  }
)
