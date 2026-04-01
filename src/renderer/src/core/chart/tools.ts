import { ChartTypeV2 } from '@preload/chart-types'
import { Chart } from '@renderer/core/chart/chart'
import { RefreshAll } from '@renderer/core/misc/refresh-all'

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
    RefreshAll.fuck()
}

function mirror(nids: number[]) {
    const notes: ChartTypeV2.note[] = nids.map((nid) => Chart.$current.diff.to_note(nid))
    notes.forEach((note) => {
        const midLane = (4 - note.width) / 2
        note.lane = Math.round(-(note.lane - midLane) + midLane)
    })
    RefreshAll.fuck()
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
    RefreshAll.fuck()
}
