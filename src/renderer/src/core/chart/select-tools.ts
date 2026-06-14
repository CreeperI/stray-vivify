import { ChartTypeV2 } from '@preload/chart-types'
import { Chart } from '@renderer/core/chart/chart'

export const EditorTools = {
  test: test,
  mirror: mirror,
  mutiplier: timeMultiplier
}

function test(notes: ChartTypeV2.note[]) {
  let maxTime = -1
  let minTime = 2147483647
  notes.forEach((note) => {
    maxTime = Math.max(maxTime, note.time)
    minTime = Math.min(minTime, note.time)
  })
  notes.forEach((note) => {
    note.time = Math.round(Math.random() * (maxTime - minTime) + minTime)
  })
}

function mirror(notes: ChartTypeV2.note[]) {
  const maxLane = Chart.$current.diff.max_lane.value
  notes.forEach((note) => {
    note.lane = maxLane - note.lane - note.width
  })
  Chart.current?.fuck_shown(true)
}

function timeMultiplier(notes: ChartTypeV2.note[], multiplier: number, baseOnZero: boolean) {
  let minTime = 2147483647
  notes.forEach((note) => {
    minTime = Math.min(minTime, note.time)
  })
  const baseTime = baseOnZero ? 0 : minTime
  notes.forEach((note) => {
    note.time = Math.round((note.time - baseTime) * multiplier + baseTime)
    if ('len' in note) {
      note.len = Math.round(note.len * multiplier)
    }
  })
  Chart.current?.fuck_shown(true)
}
