import { computed, ref, watch } from 'vue'
import { Chart } from '@renderer/core/chart'
import { ChartType, Invoker } from '@preload/types'
import { notify } from '@renderer/core/notify'
import Settings from '@renderer/core/settings'

const ipcRenderer = window.electron.ipcRenderer
const invoker: Invoker = ipcRenderer.invoke

const settings = Settings
const CURRENT_BUILD = 4

function calc_mul() {
  return settings.scale.value * 200 + 100
}

const ui = {
  CURRENT_BUILD,
  state: ref('startUp' as 'startUp' | 'charting' | 'cache'),
  path: ref<string>(),
  ask_open() {
    if (this.ask_state) return
    this.set_state(true)
    Chart.send.open_chart()
  },
  chart: undefined as Chart | undefined,
  ipcRenderer,
  isMaximized: ref(false),
  invoke: invoker,
  notify: notify,
  /* this property refers to pixels per millisecond,
 using it as (note.t * mul) and u get a pixel value

 specially for holds it'd be used as
``(note.t + note.h)*mul``
 */
  mul: computed(() => calc_mul() / 1000),
  mul_sec: computed(() => calc_mul()),
  chart_name: ref<string>(''),
  note_choice(val: ChartType.note['n']) {
    const type = settings.note_type
    if (type.value == val) type.value = ''
    else type.value = val
  },
  windowHeight: ref(window.outerHeight),
  windowWidth: ref(window.outerWidth),
  ask_state: false,
  set_state(v: boolean) {
    this.ask_state = v
  },
  open_chart(p: string) {
    Chart.send.open_chart(p)
  },
  get_chart() {
    if (!this.chart) throw new Error('what the fuck you called this')
    return this.chart
  },
  settings,
  update_flag: ref(114),
  refresh() {
    this.update_flag.value = Math.random()
  }
}

ipcRenderer.on('window-max-state', (_, state: boolean) => {
  ui.isMaximized.value = state
})
watch(settings.volume, (v) => {
  if (!ui.chart) return
  ui.chart.audio.volume = v / 100
})

export default ui
// @ts-ignore
window.ui = ui
