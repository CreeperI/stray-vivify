import { Ref, ref } from 'vue'
import { charts_data } from '@preload/types'
import { Invoke } from '@renderer/core/ipc'
import { Chart } from '@renderer/core/chart/chart'
import { Version } from '@renderer/core/storage'

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


  export let is_dev = false
  export async function check_dev() {
    is_dev = await Invoke('is-dev')
    if (is_dev) Version.str += '-dev'
    return is_dev
  }

  export async function close_app() {
    const current = Chart.current
    if (current) {
      await current.save()
    }
    window.electron.ipcRenderer.send('window-close')
  }

  export const func_keys = ref({ ctrl: false, alt: false })
  document.addEventListener('mousemove', function (e) {
    func_keys.value.ctrl = e.ctrlKey
    func_keys.value.alt = e.altKey
  })

  export const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
}
