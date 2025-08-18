import { IpcHandlers } from '@preload/types'
import { computed, ref } from 'vue'
import { notify } from '@renderer/core/notify'
import { Chart } from '@renderer/core/chart/chart'
import { modal } from '@renderer/core/modal'
import { Settings } from '@renderer/core/Settings'

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

const ref_window = {
  height: ref(window.outerHeight),
  width: ref(window.outerWidth),
  isMaximized: ref(false)
}
const refs = {
  window: ref_window,
  /* pixel/ms */
  mul: computed(() => (Settings.editor.scale * 200 + 100) / 1000),
  state: ref('startUp' as 'startUp' | 'charting' | 'cache'),
  visible: computed(() => {
    return Math.round(ref_window.height.value / refs.mul.value)
  }),
  current_name: ref('')
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
  notify: notify,
  refs,
  update,
  refresh,
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

// @ts-ignore
window.charter = Charter
