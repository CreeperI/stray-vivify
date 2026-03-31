import { ChartTypeV2 } from '@preload/chart-types'
import { Chart } from '@renderer/core/chart/chart'


export const EditorTools = {
    test: test,
    mirror: mirror
}

function test(nids: number[]) {
    console.log("test triggered!")
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
}

function mirror(nids: number[]) {
    const notes: ChartTypeV2.note[] = nids.map((nid) => Chart.$current.diff.to_note(nid))
    notes.forEach((note) => {
        const midLane = (4 - note.width) / 2
        note.lane = Math.round(-(note.lane - midLane) + midLane)
    })
}