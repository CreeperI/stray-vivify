import { inject, Ref, ref } from 'vue'
import { charts_data, ChartTypeV2 } from '@preload/types'
import { Invoke } from '@renderer/core/ipc'
import { Chart } from '@renderer/core/chart/chart'

export namespace GlobalStat {
  type routes = 'start' | 'wait' | 'editor'
  export const route = {
    route: ref('start' as routes),
    change(p: routes) {
      this.route.value = p
    }
  }
  export let all_chart = [] as charts_data
  export const all_chart_ref = ref(all_chart)
  export async function update_all_chart() {
    all_chart = (await Invoke('get-charts-data')).sort((a, b) => b.last_open - a.last_open)
    all_chart_ref.value = all_chart
  }
  export const window_max_state = ref(false)
  export function log(...args: any) {
    for (const arg of args) {
      console.log(JSON.stringify(arg))
    }
  }
  export const window_size = {
    height: screen.availHeight,
    width: screen.availWidth
  }
  export const refs = {
    chart_tab: ref(2),
    header_display: ref(''),
    window: {
      height: ref(screen.height),
      width: ref(screen.width)
    }
  }
  // 0 - charting 1 - recording 2 - playing
  export const chart_state = ref(0) as Ref<0 | 1 | 2>
  export function set_state(v: 0 | 1 | 2) {
    chart_state.value = v
  }

  export namespace NoteClipboard {
    export const selected = ref<number[]>([])
    export const clipboard = ref<ChartTypeV2.note[]>([])

    export function clear() {
      clipboard.value = []
      selected.value = []
    }

    export let copy = () => {}
    export let cut = () => {}
    export let paste = () => {}
  }

  export let is_dev = false
  export async function check_dev() {
    is_dev = await Invoke('is-dev')
  }

  export const SvgSizing = {
    max_lane: 4,
    lane_width: 130,
    svg_width: 520,
    bar_length: 500,
    view_port: [0, 0, 520, window.screen.height],
    taskBarHeight: screen.height - screen.availHeight
  }
  export function useSvgSizing() {
    const lane_width = inject<number>('lane_width', 130)
    const max_lane = SvgSizing.max_lane
    const svg_width = max_lane * lane_width + 2 * 50 + 12
    const bar_length = max_lane * lane_width + 12
    const view_port = [0, 0, svg_width, window.screen.height]
    return {
      lane_width,
      svg_width,
      bar_length,
      view_port,
      taskBarHeight: screen.height - screen.availHeight,
      max_lane: SvgSizing.max_lane
    }
  }

  export async function close_app() {
    const current = Chart.current
    if (current) {
      await current.save()
    }
    window.electron.ipcRenderer.send('window-close')
  }
}
