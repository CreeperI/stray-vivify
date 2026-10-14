/**
 * MMA `js/patterns/primitives.js` 的逐行移植。
 *
 * 只做移植层面的改动：
 *   1. 包进 `PatternPrimitives` namespace；
 *   2. import 改为 `PatternConfig` / `PatternChart`；
 *   3. 参数补最小类型标注（`any`）。
 * 所有数值、阈值、字段名与顺序保持原样。
 */
import { PatternChart } from './pattern-chart'
import { PatternConfig } from './pattern-config'

export namespace PatternPrimitives {
  export const Direction = {
    NONE: 'None',
    LEFT: 'Left',
    RIGHT: 'Right',
    OUTWARDS: 'Outwards',
    INWARDS: 'Inwards'
  }

  function keysOnLeftHand(keymode: any) {
    if (keymode === 3) return 2
    if (keymode === 4) return 2
    if (keymode === 5) return 3
    if (keymode === 6) return 3
    if (keymode === 7) return 4
    if (keymode === 8) return 4
    if (keymode === 9) return 5
    if (keymode === 10) return 5
    return Math.max(1, Math.floor(keymode / 2))
  }

  function beatLengthAt(chart: any, time: any) {
    if (!chart.BPM.length) return 500
    let current = chart.BPM[0].Data.MsPerBeat
    for (const item of chart.BPM) {
      if (item.Time > time) break
      current = item.Data.MsPerBeat
    }
    return current
  }

  export function detectDirection(previousRow: any, currentRow: any): any {
    const pleftmost = previousRow[0]
    const prightmost = previousRow[previousRow.length - 1]
    const cleftmost = currentRow[0]
    const crightmost = currentRow[currentRow.length - 1]

    const leftmostChange = cleftmost - pleftmost
    const rightmostChange = crightmost - prightmost

    let direction = Direction.NONE
    if (leftmostChange > 0) {
      direction = rightmostChange > 0 ? Direction.RIGHT : Direction.INWARDS
    } else if (leftmostChange < 0) {
      direction = rightmostChange < 0 ? Direction.LEFT : Direction.OUTWARDS
    } else if (rightmostChange < 0) {
      direction = Direction.INWARDS
    } else if (rightmostChange > 0) {
      direction = Direction.OUTWARDS
    }

    const isRoll = pleftmost > crightmost || prightmost < cleftmost
    return [direction, isRoll]
  }

  export function calculatePrimitives(chart: any) {
    const firstNote = chart.Notes[0].Time
    const firstRow = chart.Notes[0].Data

    let previousRow: any = []
    for (let k = 0; k < chart.Keys; k += 1) {
      if (
        firstRow[k] === PatternChart.NoteType.NORMAL ||
        firstRow[k] === PatternChart.NoteType.HOLDHEAD
      ) {
        previousRow.push(k)
      }
    }

    if (!previousRow.length) return []

    let previousTime = firstNote
    let index = 0
    const leftHandKeys = keysOnLeftHand(chart.Keys)
    const out: any[] = []

    for (const item of chart.Notes.slice(1)) {
      const t = item.Time
      const row = item.Data
      index += 1

      const currentRow: any[] = []
      const normalNotes: any[] = []
      const lnHeads: any[] = []
      const lnBodies: any[] = []
      const lnTails: any[] = []

      for (let k = 0; k < chart.Keys; k += 1) {
        const n = row[k]
        if (n === PatternChart.NoteType.NORMAL || n === PatternChart.NoteType.HOLDHEAD)
          currentRow.push(k)
        if (n === PatternChart.NoteType.NORMAL) normalNotes.push(k)
        if (n === PatternChart.NoteType.HOLDHEAD) lnHeads.push(k)
        else if (n === PatternChart.NoteType.HOLDBODY) lnBodies.push(k)
        else if (n === PatternChart.NoteType.HOLDTAIL) lnTails.push(k)
      }

      if (!currentRow.length && !lnHeads.length && !lnBodies.length && !lnTails.length) {
        continue
      }

      let direction = Direction.NONE
      let isRoll = false
      let jacks = 0

      if (currentRow.length) {
        ;[direction, isRoll] = detectDirection(previousRow, currentRow)
        const prevSet = new Set(previousRow)
        jacks = currentRow.filter((x) => prevSet.has(x)).length
      }

      out.push({
        Index: index,
        Time: t - firstNote,
        MsPerBeat: (t - previousTime) * 4.0,
        BeatLength: beatLengthAt(chart, t),
        Notes: currentRow.length,
        Jacks: jacks,
        Direction: direction,
        Roll: isRoll,
        Keys: chart.Keys,
        LeftHandKeys: leftHandKeys,
        LNHeads: lnHeads,
        LNBodies: lnBodies,
        LNTails: lnTails,
        NormalNotes: normalNotes,
        RawNotes: currentRow
      })

      if (currentRow.length) previousRow = currentRow
      previousTime = t
    }

    return out
  }

  export function lnPercent(chart: any) {
    let notes = 0
    let lnotes = 0

    for (const item of chart.Notes) {
      for (const n of item.Data) {
        if (n === PatternChart.NoteType.NORMAL) notes += 1
        else if (n === PatternChart.NoteType.HOLDHEAD) {
          notes += 1
          lnotes += 1
        }
      }
    }

    return notes > 0 ? lnotes / notes : 0
  }

  export function svTime(chart: any) {
    if (!chart.SV.length) return 0

    let total = 0
    let time = chart.FirstNote
    let vel = 1
    let nonOneIntervals = 0
    let inNonOne = false

    for (const sv of chart.SV) {
      const curVel = Number(sv.Data)
      const curNonOne =
        !Number.isFinite(curVel) ||
        Math.abs(curVel - 1) > PatternConfig.PATTERNS_CONFIG.SV_SPEED_EPS

      if (!Number.isFinite(vel) || Math.abs(vel - 1) > PatternConfig.PATTERNS_CONFIG.SV_SPEED_EPS) {
        total += sv.Time - time
      }

      if (curNonOne && !inNonOne) {
        nonOneIntervals += 1
        inNonOne = true
      } else if (!curNonOne) {
        inNonOne = false
      }

      vel = curVel
      time = sv.Time
    }

    if (!Number.isFinite(vel) || Math.abs(vel - 1) > PatternConfig.PATTERNS_CONFIG.SV_SPEED_EPS) {
      total += chart.LastNote - time
    }

    if (nonOneIntervals <= 1) {
      return 0
    }

    let extreme = false
    const bpms = chart.BPM || []
    if (bpms.length >= 1) {
      let prevMsPerBeat: any = null
      for (const item of bpms) {
        const msPerBeat = Number(item?.Data?.MsPerBeat)
        if (!Number.isFinite(msPerBeat) || msPerBeat <= 0) {
          extreme = true
          break
        }

        const bpm = 60000.0 / msPerBeat
        if (
          bpm <= PatternConfig.PATTERNS_CONFIG.SV_EXTREME_BPM_MIN ||
          bpm >= PatternConfig.PATTERNS_CONFIG.SV_EXTREME_BPM_MAX
        ) {
          extreme = true
          break
        }

        if (Number.isFinite(prevMsPerBeat) && prevMsPerBeat > 0) {
          const ratio = Math.max(prevMsPerBeat / msPerBeat, msPerBeat / prevMsPerBeat)
          if (ratio >= PatternConfig.PATTERNS_CONFIG.SV_EXTREME_BPM_RATIO) {
            extreme = true
            break
          }
        }

        prevMsPerBeat = msPerBeat
      }
    }

    if (extreme) {
      return Math.max(total, PatternConfig.PATTERNS_CONFIG.SV_AMOUNT_THRESHOLD + 1.0)
    }

    return total
  }
}
