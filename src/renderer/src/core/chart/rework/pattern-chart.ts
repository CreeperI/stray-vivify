/**
 * MMA `js/patterns/chart.js` 的逐行移植。
 *
 * 只做移植层面的改动：
 *   1. 包进 `PatternChart` namespace；
 *   2. 补 `TimeItem` / `Chart` 类型与最小参数标注。
 * `createChart` 的 `FirstNote` / `LastNote` 仍然是 getter，语义不变。
 */
export namespace PatternChart {
  export const NoteType = Object.freeze({
    NOTHING: 0,
    NORMAL: 1,
    HOLDHEAD: 2,
    HOLDBODY: 3,
    HOLDTAIL: 4
  })

  /** 同一结构既装 `number`（SV）、`NoteType` 数组（Notes）和 BPM 对象，故 Data 用 any。 */
  export type TimeItem = { Time: number; Data: any }

  export type Chart = {
    Keys: number
    Notes: TimeItem[]
    BPM: TimeItem[]
    SV: TimeItem[]
    readonly FirstNote: number
    readonly LastNote: number
  }

  export function createTimeItem(time: any, data: any): TimeItem {
    return { Time: Number(time), Data: data }
  }

  export function createBPM(meter: any, msPerBeat: any): { Meter: any; MsPerBeat: any } {
    return { Meter: meter, MsPerBeat: msPerBeat }
  }

  export function createChart(keys: any, notes: any, bpm: any, sv: any): Chart {
    return {
      Keys: keys,
      Notes: notes,
      BPM: bpm,
      SV: sv,
      get FirstNote() {
        return this.Notes[0].Time
      },
      get LastNote() {
        return this.Notes[this.Notes.length - 1].Time
      }
    }
  }
}
