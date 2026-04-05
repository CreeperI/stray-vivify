import { ChartTypeV2 } from '@preload/chart-types'
import { Chart } from '@renderer/core/chart/chart'
import { EventHub } from '@renderer/core/misc/eventhub'

export const EditorTools = {
  test: test,
  mirror: mirror,
  mutiplier: timeMultiplier
}

function test(nids: number[]) {
  const notes: ChartTypeV2.note[] = nids.map((nid) => Chart.$current.diff.to_note(nid))
  let maxTime = -1
  let minTime = 2147483647
  notes.forEach((note) => {
    maxTime = Math.max(maxTime, note.time)
    minTime = Math.min(minTime, note.time)
  })
  notes.forEach((note) => {
    note.time = Math.round(Math.random() * (maxTime - minTime) + minTime)
  })
  EventHub.dispatch('fuck-shown')
}

function mirror(nids: number[]) {
  const notes: ChartTypeV2.note[] = nids.map((nid) => Chart.$current.diff.to_note(nid))
  const maxLane = Chart.$current.diff.max_lane.value
  notes.forEach((note) => {
    note.lane = maxLane - note.lane - note.width
  })
  EventHub.dispatch('fuck-shown')
}

function timeMultiplier(nids: number[], multiplier: number, baseOnZero: boolean) {
  let minTime = 2147483647
  const notes: ChartTypeV2.note[] = nids.map((nid) => Chart.$current.diff.to_note(nid))
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
  EventHub.dispatch('fuck-shown')
}
