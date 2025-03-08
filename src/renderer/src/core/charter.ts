import { ChartType, Invoker } from '@preload/types'
import { computed, reactive, ref, toRefs, watch } from 'vue'
import Translations, { LanguageData, Languages } from '@renderer/core/translations'
import { utils } from '@renderer/core/utils'
import { notify } from '@renderer/core/notify'
import { _chart } from '@renderer/core/chart'
import { modal } from '@renderer/core/modal'

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
  },
  open_url(url: string) {
    return _invoke('open-url', url)
  },
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
  fn.to_refs = toRefs(data)

  fn.lang = (lang: any) => {
    if (lang in Languages) data.lang = lang
    else data.lang = 'zh_cn'
  }
  fn.note_type = (nt: any) => {
    if (['n', 'h', 's', 'mb', 'm', 'b'].includes(nt)) data.note_type = nt
    else data.note_type = ''
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
  watch(
    () => data.lang,
    (v) => {
      utils.assign(Translations, LanguageData['zh_cn'])
      utils.assign(Translations, LanguageData[v])
    }
  )
  watch(
    () => data.volume,
    (v) => {
      if (_chart.current) _chart.current.audio.volume = v / 100
    }
  )
  return fn
})()

const ref_window = {
  height: ref(window.outerHeight),
  width: ref(window.outerWidth),
  isMaximized: ref(false)
}
const refs = {
  window: ref_window,
  /* pixel/ms */
  mul: computed(() => (settings_function.data.scale * 200 + 100) / 1000),
  state: ref('startUp' as 'startUp' | 'charting' | 'cache'),
  visible: computed(() => Math.round(ref_window.height.value / refs.mul.value)),
  current_name: ref('')
}
const note = {
  type: settings_function.to_refs.note_type,
  note_choice(val: ChartType.note['n']) {
    const type = settings_function.to_refs.note_type
    if (type.value == val) type.value = ''
    else type.value = val
  }
}

const update = (() => {
  const flag = ref(114)
  const update = () => {
    flag.value = Math.random()
  }
  update.flag = flag
  return update
})()
const refresh = (() => {
  const flag = ref(true)
  const refresh = () => {
    flag.value = !flag.value
    setTimeout(() => (flag.value = true), 10)
  }
  refresh.flag = flag
  return refresh
})()

const record = {
  mode: ref(false),
  show_bar_line: ref(false),
  show_bar_count: ref(false),
  show_bpm: ref(false)
}

const CURRENT_BUILD = 4

export const Charter = {
  invoke: Invoke,
  ipcRenderer,
  settings: settings_function,
  notify: notify,
  refs,
  note,
  update,
  refresh,
  record,
  CURRENT_BUILD,
  get state() {
    return refs.state
  },
  get_chart() {
    if (_chart.current) return _chart.current
    throw new Error('No chart loaded.')
  },
  if_current() {
    return _chart.current
  },
  load_state: false,
  modal
}

ipcRenderer.on('window-max-state', (_, state: boolean) => {
  Charter.refs.window.isMaximized.value = state
})

// @ts-ignore
window.charter = Charter
