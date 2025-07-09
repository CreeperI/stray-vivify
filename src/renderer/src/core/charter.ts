import { ChartType, IpcHandlers } from '@preload/types'
import { computed, reactive, ref, toRefs, watch } from 'vue'
import Translations, { LanguageData, Languages } from '@renderer/core/translations'
import { utils } from '@renderer/core/utils'
import { notify } from '@renderer/core/notify'
import { Chart } from '@renderer/core/chart/chart'
import { modal } from '@renderer/core/modal'

const ipcRenderer = window.electron.ipcRenderer
const _invoke: IpcHandlers.invoke.invoke = ipcRenderer.invoke
const prevent_loop = {
  data: {} as Record<string, number>,
  timer(key: string, max: number) {
    if (!(key in prevent_loop.data)) prevent_loop.data[key] = Date.now()
    else {
      if (Date.now() - prevent_loop.data[key] > max) debugger
    }
  },
  fuck_timer(key: string) {
    if (key in prevent_loop.data) delete prevent_loop.data[key]
  }
}
const Invoke = _invoke
const timer = {
  saved: {} as Record<string, number>,
  timer(key: string, ...val: any) {
    if (!(key in timer.saved)) timer.saved[key] = Date.now()
    else {
      const now = Date.now()
      console.log(`Timer ${key}:${now - timer.saved[key]}ms`, ...val)
      timer.saved[key] = now
    }
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
    reverse_scroll: false,
    lane_width: 140
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
      if (Chart.current) Chart.current.audio.volume = v / 100
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
type load_state_strings = 'success' | 'failed' | 'pending'
const load_state = (() => {
  const data = {
    asked_path: 'pending' as load_state_strings,
    load_music_from_backend: 'pending' as load_state_strings,
    create_music_blob: 'pending' as load_state_strings,
    waiting_can_play: 'pending' as load_state_strings
  }
  const _ref = ref(data)
  const clear = () => {
    _ref.value.asked_path = 'pending'
    _ref.value.load_music_from_backend = 'pending'
    _ref.value.create_music_blob = 'pending'
    _ref.value.waiting_can_play = 'pending'
  }
  return {
    data: _ref,
    clear
  }
})()

const CURRENT_BUILD = 5

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
    if (Chart.current) return Chart.current
    throw new Error('No chart loaded.')
  },
  if_current() {
    return Chart.current
  },
  modal,
  timer,
  constants: {
    rem: Number(window.getComputedStyle(document.documentElement).fontSize.replace('px', '')),
    screenH: window.screen.height,
    screenW: window.screen.width
  },
  prevent_loop: prevent_loop,
  load_state: load_state
}

ipcRenderer.on('window-max-state', (_, state: boolean) => {
  Charter.refs.window.isMaximized.value = state
})

// @ts-ignore
window.charter = Charter
