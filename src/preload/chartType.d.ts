export namespace ChartType {
  /**
   *   [time, lane, type, extra?]
   *   type0 note
   *   type1 bumper
   *   type2 hold extra:id1, value: end-time
   *   type3 bpm modify extra: value: bpm
   *   type4 sound note just so fucking noisy
   *   type5 deprecated
   *   type6 bomb
   *   type7 bomb-bumper
   *   type8 sbumper
   *
   */
  export type notes_data = (
    | [number, number, number]
    | [number, number, 2, number]
    | [number, number, 3, number]
  )[]

  export type save_data = {
    diffs: { name: string; notes: notes_data }[]
    save_time: number
  }

  export type diffs_data = { name: string; notes: notes_data }[]

  export interface ChartData {
    music: string
    diffs: diffs_data
    diff_name: string
  }
}
export type OpenChartReturn =
  | {
      state: 'success' | 'created' | 'new_json'
      music: string
      data: ChartType.diffs_data
    }
  | { state: 'cancel' | 'missing' }
