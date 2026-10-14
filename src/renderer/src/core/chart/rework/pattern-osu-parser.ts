import { PatternChart } from './pattern-chart'
import { Rework_Parser } from './parser'

/**
 * MMA `js/parser/patternOsuParser.js` 的移植。
 *
 * 与上游的差别：
 *   1. 包进 `PatternOsuParser` namespace；
 *   2. 只保留 **`parseFromParts()`** 入口（hitObjects/timingPoints 由
 *      `Rework_DiffNotes` + `laneToX` 给出）。上游的 `.osu` 文本路径
 *      （`parseOsuManiaFromText` 及其 sections/KV/timing/hitobject 行解析）
 *      在本项目无调用方，已按"删掉未使用函数"移除；
 *   3. **行为偏离（按需求）**：遇到「同列音符落在 LN 体内 / LN 头相撞」时不再抛
 *      `Stacked note` / `Stacked LN` 错误，而是**直接忽略**该物件并计入
 *      `stackedStats.ignored`。原因：MMA 只面向 osu!/Malody 的合法 .osu（不允许这种写法），
 *      而 stray-vivify 是自由编辑器、允许同列音符叠在 LN 里；实测仓库 `charts/` 里约一半
 *      谱面会命中，若抛错则键型面板整体失败。除这三处外所有数值、阈值、字段名与
 *      控制流保持原样。
 */
export namespace PatternOsuParser {
  /** 被忽略的 stacknote 计数（每次 buildChart 开始时清零），供 UI 如实提示 */
  export const stackedStats = { ignored: 0 }

  export type HitObject =
    | { kind: 'HitCircle'; X: number; Time: number; EndTime?: number }
    | { kind: 'Hold'; X: number; Time: number; EndTime: number }

  export type TimingPoint =
    | { kind: 'Uninherited'; Time: number; MsPerBeat: number; Meter: number }
    | { kind: 'Inherited'; Time: number; Multiplier: number }

  function findEarliestUpcomingRelease(holdingUntil: any): any {
    let earliest = Infinity
    for (const h of holdingUntil) {
      if (h != null && h < earliest) earliest = h
    }
    return earliest
  }

  function convertHitObjects(objects: any, keys: any): any {
    const output: any[] = []
    const holdingUntil: any[] = Array.from({ length: keys }, () => null)
    let lastRow = PatternChart.createTimeItem(-Infinity, [])

    function finishHolds(time: any): any {
      let earliest = findEarliestUpcomingRelease(holdingUntil)

      while (earliest < time) {
        for (let k = 0; k < keys; k += 1) {
          if (holdingUntil[k] === earliest) {
            if (earliest > lastRow.Time) {
              lastRow = PatternChart.createTimeItem(
                earliest,
                Array.from({ length: keys }, () => PatternChart.NoteType.NOTHING)
              )
              output.push(lastRow)
              for (let kk = 0; kk < keys; kk += 1) {
                if (holdingUntil[kk] != null) {
                  lastRow.Data[kk] = PatternChart.NoteType.HOLDBODY
                }
              }
            }

            const cur = lastRow.Data[k]
            if (cur === PatternChart.NoteType.NOTHING || cur === PatternChart.NoteType.HOLDBODY) {
              lastRow.Data[k] = PatternChart.NoteType.HOLDTAIL
              holdingUntil[k] = null
            } else {
              // 偏离 MMA：原为 throw new Error('impossible (HOLDTAIL overwrite conflict)')，
              // 按需求改为忽略这次尾标记（音符已占住该列）。
              stackedStats.ignored += 1
            }
          }
        }
        earliest = findEarliestUpcomingRelease(holdingUntil)
      }
    }

    function addNote(column: any, time: any): any {
      finishHolds(time)

      if (time > lastRow.Time) {
        lastRow = PatternChart.createTimeItem(
          time,
          Array.from({ length: keys }, () => PatternChart.NoteType.NOTHING)
        )
        output.push(lastRow)
        for (let k = 0; k < keys; k += 1) {
          if (holdingUntil[k] != null) lastRow.Data[k] = PatternChart.NoteType.HOLDBODY
        }
      }

      const cur = lastRow.Data[column]
      if (cur === PatternChart.NoteType.NOTHING) {
        lastRow.Data[column] = PatternChart.NoteType.NORMAL
      } else if (cur === PatternChart.NoteType.NORMAL || cur === PatternChart.NoteType.HOLDHEAD) {
        // keep stacked note behavior
      } else {
        // 偏离 MMA：原为
        // `throw new Error(\`Stacked note at ${time}, column ${column + 1}, coincides with ${cur}\`)`，
        // 按需求改为忽略这个音符（它落在同列的 LN 体内或与 LN 尾同刻）。
        stackedStats.ignored += 1
      }
    }

    function startHold(column: any, time: any, endTime: any): any {
      finishHolds(time)

      if (time > lastRow.Time) {
        lastRow = PatternChart.createTimeItem(
          time,
          Array.from({ length: keys }, () => PatternChart.NoteType.NOTHING)
        )
        output.push(lastRow)
        for (let k = 0; k < keys; k += 1) {
          if (holdingUntil[k] != null) lastRow.Data[k] = PatternChart.NoteType.HOLDBODY
        }
      }

      const cur = lastRow.Data[column]
      if (cur === PatternChart.NoteType.NOTHING || cur === PatternChart.NoteType.NORMAL) {
        lastRow.Data[column] = PatternChart.NoteType.HOLDHEAD
        holdingUntil[column] = endTime
      } else {
        // 偏离 MMA：原为
        // `throw new Error(\`Stacked LN at ${time}, column ${column + 1}, head coincides with ${cur}\`)`，
        // 按需求改为忽略这个 LN 头（同列已有 LN 体/头）。
        stackedStats.ignored += 1
      }
    }

    for (const obj of objects) {
      if (obj.kind === 'HitCircle') {
        addNote(Rework_Parser.xToColumn(obj.X, keys), Number(obj.Time))
      } else if (obj.kind === 'Hold') {
        if (obj.EndTime > obj.Time) {
          startHold(Rework_Parser.xToColumn(obj.X, keys), Number(obj.Time), Number(obj.EndTime))
        } else {
          addNote(Rework_Parser.xToColumn(obj.X, keys), Number(obj.Time))
        }
      }
    }

    finishHolds(Infinity)
    return output
  }

  function findBpmDurations(points: any, endTime: any): any {
    const uninherited = points.filter((p: any) => p.kind === 'Uninherited')
    if (!uninherited.length) {
      throw new Error('Beatmap has no BPM points set')
    }

    const data = new Map()
    let current = Number(uninherited[0].MsPerBeat)
    let time = Number(uninherited[0].Time)

    for (const b of uninherited.slice(1)) {
      if (!data.has(current)) data.set(current, 0)
      data.set(current, data.get(current) + (Number(b.Time) - time))
      time = Number(b.Time)
      current = Number(b.MsPerBeat)
    }

    if (!data.has(current)) data.set(current, 0)
    data.set(current, data.get(current) + Math.max(endTime - time, 0))

    return data
  }

  function convertTimingPoints(points: any, endTime: any): any {
    const durations = findBpmDurations(points, endTime)
    const mostCommonMspb = [...durations.entries()].sort((a: any, b: any) => b[1] - a[1])[0][0]

    const sv: any[] = []
    const bpm: any[] = []
    let currentBpmMult = 1

    for (const p of points) {
      if (p.kind === 'Uninherited') {
        const mspb = Number(p.MsPerBeat)
        bpm.push(
          PatternChart.createTimeItem(Number(p.Time), PatternChart.createBPM(Number(p.Meter), mspb))
        )
        currentBpmMult = mspb !== 0 ? Number(mostCommonMspb) / mspb : 1
        sv.push(PatternChart.createTimeItem(Number(p.Time), currentBpmMult))
      } else {
        sv.push(PatternChart.createTimeItem(Number(p.Time), currentBpmMult * Number(p.Multiplier)))
      }
    }

    return [bpm, sv]
  }

  function cleanedSv(sv: any): any {
    if (!sv.length) return []

    const rev = [...sv].reverse()
    const seen = new Set()
    const dedupRev: any[] = []
    for (const item of rev) {
      if (seen.has(item.Time)) continue
      seen.add(item.Time)
      dedupRev.push(item)
    }
    const dedup = dedupRev.reverse()

    const out: any[] = []
    let previousValue = 1
    for (const s of dedup) {
      if (Math.abs(Number(s.Data) - previousValue) > 0.005) {
        out.push(s)
        previousValue = Number(s.Data)
      }
    }
    return out
  }

  /**
   * hitObjects/timingPoints 已就绪后的转换 + 收尾。
   * 上游同名逻辑（`parseOsuManiaFromText` 的尾部）原样保留。
   */
  function buildChart(keys: number, timingPoints: any, hitObjects: any): PatternChart.Chart {
    stackedStats.ignored = 0
    const snaps = convertHitObjects(hitObjects, keys)
    if (!snaps.length) {
      throw new Error('Beatmap has no hitobjects after conversion')
    }

    const endTime = snaps[snaps.length - 1].Time
    let bpm: any = []
    let sv: any = []

    if (timingPoints.length) {
      const converted = convertTimingPoints(timingPoints, endTime)
      bpm = converted[0]
      sv = cleanedSv(converted[1])
    } else {
      bpm = [PatternChart.createTimeItem(0, PatternChart.createBPM(4, 500.0))]
      sv = [PatternChart.createTimeItem(0, 1.0)]
    }

    return PatternChart.createChart(keys, snaps, bpm, sv)
  }

  /**
   * 唯一的对外入口：直接吃 hitObjects / timingPoints。
   * `X` 是 0..512 的 x 坐标，列由 `convertHitObjects` 内的 `xToColumn` 决定。
   */
  export function parseFromParts(
    keys: number,
    hitObjects: HitObject[],
    timingPoints: TimingPoint[]
  ): PatternChart.Chart {
    return buildChart(keys, timingPoints, hitObjects)
  }
}
