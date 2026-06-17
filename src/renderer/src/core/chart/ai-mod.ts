import { ChartTypeV2 } from '@preload/chart-types'
import { utils } from '@renderer/core/utils'
import { Storage } from '@renderer/core/storage'

type normal_note = ChartTypeV2.normal_note
type hold_note = ChartTypeV2.hold_note

export function aiMod(diff: ChartTypeV2.diff): [number, string][] {
  const nearest = Storage.settings.nearest
  const results: [number, string][] = []
  const checkedPairs = new Set<string>()

  // 分离并索引
  interface INorm {
    idx: number
    note: normal_note
  }
  interface IHold {
    idx: number
    note: hold_note
  }
  const normals: INorm[] = []
  const holds: IHold[] = []
  diff.notes.forEach((n, idx) => {
    if ('len' in n) holds.push({ idx, note: n as hold_note })
    else normals.push({ idx, note: n as normal_note })
  })

  const laneInt = (lane: number, w: number): [number, number] => [lane, lane + w]
  const contains = (a: [number, number], b: [number, number]) => a[0] <= b[0] && a[1] >= b[1]
  const pairKey = (i: number, j: number) => (i < j ? `${i}-${j}` : `${j}-${i}`)

  if (!normals.length && !holds.length) return []

  // 时间跨度
  const times = [
    ...normals.map((n) => n.note.time),
    ...holds.map((h) => h.note.time),
    ...holds.map((h) => h.note.time + h.note.len)
  ]
  const minT = Math.min(...times)
  const maxT = Math.max(...times)

  // 分段参数
  const SEG = 2000 // 窗口长度
  const STEP = SEG * 0.75 // 步进
  let prevActiveHolds: IHold[] = []

  for (let start = minT; start < maxT + SEG; start += STEP) {
    const end = start + SEG

    // 活跃 hold：上一段未结束的 + 本段新开始的
    const continued = prevActiveHolds.filter((h) => h.note.time + h.note.len > start)
    const newHolds = holds.filter((h) => h.note.time >= start && h.note.time < end)
    const activeHolds = [...continued, ...newHolds]

    // 活跃 normal
    const activeNormals = normals.filter((n) => n.note.time >= start && n.note.time < end)

    // 1. normal ↔ normal
    for (let i = 0; i < activeNormals.length; i++) {
      const a = activeNormals[i]
      for (let j = i + 1; j < activeNormals.length; j++) {
        const b = activeNormals[j]
        if (!utils.around(a.note.time, b.note.time, nearest)) continue
        const intA = laneInt(a.note.lane, a.note.width)
        const intB = laneInt(b.note.lane, b.note.width)
        if (!contains(intA, intB) && !contains(intB, intA)) continue
        // 地雷之间允许完全覆盖
        if (a.note.snm === 1 && b.note.snm === 1) continue
        const key = pairKey(a.idx, b.idx)
        if (checkedPairs.has(key)) continue
        checkedPairs.add(key)
        results.push([a.note.time, 'normal overlap'])
      }
    }

    // 2. normal ↔ hold
    for (const n of activeNormals) {
      for (const h of activeHolds) {
        if (!utils.between(n.note.time, [h.note.time, h.note.time + h.note.len])) continue
        const intN = laneInt(n.note.lane, n.note.width)
        const intH = laneInt(h.note.lane, h.note.width)
        const hCoverN = contains(intH, intN)
        const nCoverH = contains(intN, intH)

        // 2a. hold 覆盖 normal
        if (hCoverN) {
          // 仅当 normal 宽度为1且hold更宽时无理
          if (n.note.width === 1) {
            const key = pairKey(n.idx, h.idx)
            if (checkedPairs.has(key)) continue
            checkedPairs.add(key)
            results.push([n.note.time, '米面重叠'])
          }
          continue
        }

        // 2b. normal 覆盖 hold
        if (nCoverH) {
          if (n.note.snm === 1) {
            // mine 覆盖任何 note 均无理（包括 hold）
            const key = pairKey(n.idx, h.idx)
            if (checkedPairs.has(key)) continue
            checkedPairs.add(key)
            results.push([n.note.time, 'mine covers hold'])
          } else {
            // 非 mine：仅当两者宽度均为1时无理
            if (n.note.width === 1 && h.note.width === 1) {
              const key = pairKey(n.idx, h.idx)
              if (checkedPairs.has(key)) continue
              checkedPairs.add(key)
              results.push([n.note.time, 'normal covers hold (1&1)'])
            }
          }
        }
      }
    }

    // 3. hold ↔ hold
    for (let i = 0; i < activeHolds.length; i++) {
      const a = activeHolds[i]
      for (let j = i + 1; j < activeHolds.length; j++) {
        const b = activeHolds[j]
        if (b == a) continue
        if (a.note.lane !== b.note.lane) continue
        if (a.note.width !== b.note.width) continue
        if (!utils.between(a.note.time, [b.note.time, b.note.time + b.note.len]) &&
          !utils.between(b.note.time, [a.note.time, a.note.time + a.note.len])) continue
        const key = pairKey(a.idx, b.idx)
        if (checkedPairs.has(key)) continue
        checkedPairs.add(key)
        results.push([a.note.time, '面重叠'])
      }
    }

    prevActiveHolds = activeHolds
  }

  return results
}
