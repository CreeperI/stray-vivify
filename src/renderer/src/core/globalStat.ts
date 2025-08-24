import { Ref, ref } from 'vue'
import { charts_data } from '@preload/types'
import { Invoke } from '@renderer/core/ipc'
import { Chart } from '@renderer/core/chart/chart'

type routes = 'start' | 'wait' | 'editor'
const route = {
  route: ref('start' as routes),
  change(p: routes) {
    this.route.value = p
  }
}

export const GlobalStat = {
  route: route,
  chart: undefined as Chart | undefined,
  get $chart() {
    if (!this.chart) throw new Error('No chart')
    return this.chart
  },
  all_chart: [] as charts_data,
  async update_all_chart() {
    this.all_chart =
      (await Invoke('get-charts-data'))
        .sort((a, b) => b.last_open - a.last_open)
  },
  window_max_state: ref(false),
  log(...args: any) {
    for (const arg of args) {
      console.log(JSON.stringify(arg))
    }
  },
  window: {
    height: screen.availHeight,
    width: screen.availWidth
  },
  refs: {
    chart_tab: ref(2),
    header_display: ref(''),

  },
  // 0 - charting 1 - recording 2 - playing
  chart_state: ref(0) as Ref<0 | 1 | 2>,
  set_state(v: 0 | 1 | 2) {
    this.chart_state.value = v
  }
}

//@ts-ignore
window.globalstats = GlobalStat
