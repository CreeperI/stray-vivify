import { ipcRenderer } from 'electron'
import { ChartType, OpenChartReturn } from '@preload/chartType'
import ui from '@renderer/core/ui'

export class Chart {
  diffs: ChartType.diffs_data
  music: string

  constructor(music: string, diff: ChartType.diffs_data) {
    this.diffs = diff
    this.music = music
  }
}

const send = {
  new_chart() {
    ipcRenderer.invoke('new-chart').then((r: OpenChartReturn) => {
      if ('music' in r) {
        const {music, data} = r
        ui.chart = new Chart(music, data)
      }
    })
  },
  open_exist(p: string) {
    ipcRenderer.invoke('open-exist-chart', p).then((r: OpenChartReturn) => {
      if ('music' in r) {
        const {music, data} = r
        ui.chart = new Chart(music, data)
      }
    })
  }
}
