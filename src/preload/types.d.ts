import { Buffer } from 'buffer'
import storage_scheme = storages.storage_scheme

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

  /** @deprecated*/
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
  export type note_type = note['n']

  export interface song {
    name: string
    composer: string
    bpm: string
  }

  export interface Chart {
    song: song
    diffs: Diff[]
  }

  export type Diff = {
    name: string
    hard: string
    notes: note[]
    charter: string
  }
  export type bpm_part = {
    time: number
    bpm: number
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
        name: string
      }
    | {
        state: 'created'
        buf: buffer
        name: string
      }

  export type OpenBuffer =
    | {
        state: 'success'
        data: Buffer
      }
    | { state: 'failed'; msg: string }
  export type askPath = { path: string; name: string } | undefined
  export type readVsb = ChartType.note[] | undefined
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

export type Invoke = {
  'get-file-buffer': {
    arg: {
      fp: string
    }
    r:
      | {
          state: 'success'
          data: Buffer
        }
      | { state: 'failed'; msg: string }
  }
  'save-chart': {
    arg: {
      fp: string
      data: string
    }
    r: void
  }
  'read-vsb': {
    arg: {
      fp: string
    }
    r: ChartType.note[] | undefined
  }
  'ask-song': {
    arg: {}
    r: { path: string; name: string } | undefined
  }
  'ask-vsb': {
    arg: {}
    r: { path: string; name: string } | undefined
  }
  'open-url': {
    arg: {
      url: string
    }
    r: void
  }
  'set-storage': {
    arg: {
      data: storages.settings
    }
    r: void
  }
  'write-vsc': {
    arg: {
      id: string
      data: string
      name: string
    }
    r: void
  }
  'import-song': {
    arg: {
      path: string
      id: string
    }
    r: Promise<
      | {
          state: 'success'
          folder: string
          json: string
        }
      | {
          state: 'existed'
        }
      | {
          state: 'failed'
          reason: string
        }
      | {
          state: 'cancelled'
        }
    >
  }
  'open-song': {
    arg: {
      id: string
    }
    r: {
      data: ChartType.Chart
      path: string
    } | void
  }
  'get-charts-data': {
    arg: {}
    r: charts_data
  }
  'update-chart-data': {
    arg: {
      id: string
      // parse first
      data: string
    },
    r: void
  },
  'get-shortcut-data':{
    arg:{},
    r: string | undefined
  },
  'get-settings-data': {
    arg: {},
    r: storages.settings
  }
}

export type Send = {
  'notify-normal': {
    arg: {
      msg: string
      dur: number
    }
    r: void
  }
  'ask-id': {
    arg: {
      ids: string[]
    }
    r: Promise<string | 0>
  }
}
type dic2arr<T> = T extends { [K in keyof T]: T[K] } ? { [K in keyof T]: T[K] }[keyof T][] : never

export namespace IpcHandlers {
  export namespace invoke {
    export type invoke = <T extends keyof Invoke>(
      msg: T,
      ...arg: dic2arr<Invoke[T]['arg']>
    ) => Promise<Invoke[T]['r']>

    export type handler = {
      [T in keyof Invoke]: (
        _: Electron.IpcMainInvokeEvent,
        ...arg: dic2arr<Invoke[T]['arg']>
      ) => Invoke[T]['r']
    }
  }
  export namespace send {
    export type send = <T extends keyof Send>(
      msg: T,
      ...arg: dic2arr<Send[T]['arg']>
    ) => Promise<Send[T]['r']>

    export type handler = {
      [T in keyof Send]: (
        _: Electron.IpcRendererEvent,
        ...arg: dic2arr<Send[T]['arg']>
      ) => Send[T]['r']
    }
  }
}
export namespace storages {
  export interface settings {
    scale: number
    lang: string
    meter: number
    middle: boolean
    note_type: ChartTypeV2.note['type'] | ''
    overlap_minimum: number
    reverse_scroll: boolean
    volume: number
    lane_width: number
    language: Languages
  }

  export interface storage_scheme {
    settings: settings
    version: number
    shortcut: string
  }
}
export type charts_data = {
  last_open: number
  id: string
  name: string
  composer: string
  bpm: string
  ext: string
  diffs: string[]
}[]
