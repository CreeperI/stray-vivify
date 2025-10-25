import { Chart } from '@renderer/core/chart/chart'
import { Chart_diff } from '@renderer/core/chart/diff'

export class Chart_Diff_SV {
  chart: Chart
  diff: Chart_diff

  constructor(diff: Chart_diff) {
    this.diff = diff
    this.chart = diff.chart
  }
}
