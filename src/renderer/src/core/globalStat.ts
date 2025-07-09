import { ref } from 'vue'
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
    this.all_chart = await Invoke('get-charts-data')
    console.log(this.all_chart)
  },
  window_max_state: ref(false),
  log(...args: any) {
    for (const arg of args) {
      console.log(JSON.stringify(arg))
    }
  }
}

//@ts-ignore
window.globalstats = GlobalStat
