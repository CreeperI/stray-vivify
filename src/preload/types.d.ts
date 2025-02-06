import { Buffer } from 'buffer'

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

  export type Bpm_part = {
    bpm: number
    time: number
    len: number
  }
  /** @deprecated*/
  export type Diff_data = Bpm_part[]
  /**
   * @property n note's type, for note, bumper, mine, mine-bumper, s-bumper, hold, bpm
   * @property t time in milliseconds
   * @property l lane
   * */
  export type normal_note = {
    n: 'n' | 'b' | 'm' | 'mb' | 's'
    t: number
    l: number
  }
  /**
   * @property n note's type, for bpm
   * @property t time in milliseconds
   * @property l lane
   * @property v bpm-note, for the bpm value
   * */
  export type bpm_note = {
    n: 'p'
    t: number
    l: 0
    v: number
  }
  /**
   * @property n note's type, for hold
   * @property t time in milliseconds
   * @property l lane
   * @property h hold's len (ms)
   * */
  export type hold_note = {
    n: 'h'
    t: number
    l: number
    h: number
  }
  export type note = normal_note | hold_note | bpm_note

  export interface Song {
    name: string
    composer: string
    bpm: number
  }

  export interface Chart {
    song: Song
    diffs: Diff[]
  }

  export type Diff = {
    name: string
    hard: string
    notes: note[]
    charter: string
  }
}
export namespace HandlerReturn {
  export type OpenChart =
    | {
        state: 'missing'
      }
    | {
        state: 'success'
        chart: ChartType.Chart
        buf: buffer
      }
    | {
        state: 'created'
        buf: buffer
      }

  export type OpenBuffer =
    | {
        state: 'success'
        data: Buffer
      }
    | { state: 'failed'; msg: string }
  export type askPath = { path: string; name: string } | undefined
  export type readVsb = ChartType.note[]
  export type OpenExistChart =
    | {
        state: 'missing'
      }
    | {
        state: 'success'
        chart: ChartType.Chart
        buf: buffer
        path: string
        name: string
      }
    | {
        state: 'created'
        buf: buffer
        path: string
        name: string
      }
}

export type Invoker = {
  (msg: 'get-file-buffer', p: string): Promise<HandlerReturn.OpenBuffer>
  (msg: 'save-chart', p: string, data: string): Promise<void>
  (msg: 'ask-path', fName: string, fType: string[]): Promise<HandlerReturn.askPath>
  (msg: 'open-chart', p: string): Promise<HandlerReturn.OpenChart>
  (msg: 'read-vsb', p: string): Promise<HandlerReturn.readVsb>
  (msg: 'open-exist-chart', p: string): Promise<HandlerReturn.OpenExistChart>
}
