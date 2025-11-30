import { Buffer } from 'buffer'

export interface MemoryUsage {
  /**
   * Resident Set Size, is the amount of space occupied in the main memory device (that is a subset of the total allocated memory) for the
   * process, including all C++ and JavaScript objects and code.
   */
  rss: number
  /**
   * Refers to V8's memory usage.
   */
  heapTotal: number
  /**
   * Refers to V8's memory usage.
   */
  heapUsed: number
  external: number
  /**
   * Refers to memory allocated for `ArrayBuffer`s and `SharedArrayBuffer`s, including all Node.js Buffers. This is also included
   * in the external value. When Node.js is used as an embedded library, this value may be `0` because allocations for `ArrayBuffer`s
   * may not be tracked in that case.
   */
  arrayBuffers: number
}
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

  // this is what a JSON file looks like finally
  export interface Chart {
    song: song
    diffs: Diff[]
  }

  export type Diff = {
    name: string
    hard: string
    charter: string
    notes: note[]
  }
  export type bpm_part = {
    time: number
    bpm: number
  }
}

export namespace ChartTypeV2 {
  export type normal_note = {
    time: number
    // this is for the left anchor of the note, which is 0 for 4bumper and 2 for 2br
    lane: number
    width: number
    // s or mine, 1 for mine 2 for S 0 for normal ones
    snm: number
    ani: []
  }

  export type hold_note = {
    time: number
    lane: number
    width: number
    len: number
    ani: []
  }
  export type note = normal_note | hold_note

  export type SV = {
    time: number
    eff: number
  }

  export namespace SV_Factory {
    export type SV_aq = {
      type: 0
      time: number
      end: number
      eff1: number
      eff2: number
    }

    export type list = [SV_aq]
    export type all = list[number] | { type: number; time: number; end: number }
  }

  export type sv_all = SV | SV_Factory.all

  export type parsed_sv = {
    time: number
    eff: number
    // whether to display a line for it
    line: boolean
  }

  export type timing = {
    time: number
    bpm: number
    // 每个小节多少拍
    num: number
    // 几分音符为一拍
    den: number

    // im going to review MUSIC THEORY from elementary. wtf.
  }

  export interface song {
    name: string
    name_roman: string
    composer: string
    composer_roman: string

    bpm: string
    source: string

    sprite: string

    ref: string
  }

  export type diff = {
    notes: note[]
    timing: timing[]
    meta: meta
    ani: []
    sv: (SV | SV_Factory.all)[]
  }
  export type meta = {
    charter: string
    diff1: string
    diff2: string
    diff_name: string
  }

  export type final = {
    diffs: diff[]
    song: song
    version: number
  }

  export type note_judgement = {
    time: number
    delta: number
    /*
     * 0 for perfect+
     * 1 for perfect late
     * 2 for great late
     * 3 for good late
     * 4 for miss late
     * 5 for boooomb!
     *  */
    lvl: number
  }
  export interface SongStats {
    note: number
    speed: number
    tech: number
    fill: number
    multi: number
    total_v2: number
    total_v3: number
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
    r: [ChartTypeV2.note[], ChartTypeV2.timing[]] | undefined
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
      data: string | undefined
      path: string
    }
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
    }
    r: void
  }
  'get-conf': {
    arg: {}
    r: string | undefined
  }
  'save-conf': {
    arg: {
      data: string
    }
    r: void
  }
  'backup-chart': {
    arg: {
      id: string
      data: string
    }
    r: void
  }
  'init-data': {
    arg: {}
    r: {
      conf: string | undefined
      cd: charts_data
      skin: string | undefined
    }
  }
  'export-svc': {
    arg: {
      id: string
    }
    r: void
  }
  'export-zip': {
    arg: {
      id: string
    }
    r: void
  }
  'import-zip': {
    arg: {}
    r: Promise<void>
  }
  'remove-chart': {
    arg: {
      id: string
    }
    r: void
  }
  'import-sprite': {
    arg: {
      id: string
    }
    r: void
  }
  'import-background': {
    arg: {
      id: string
    }
    r: void
  }
  'enter-fullscreen': {
    arg: {}
    r: void
  }
  'leave-fullscreen': {
    arg: {}
    r: void
  }
  'write-file': {
    arg: {
      id: string
      fname: string
      data: string
    }
    r: void
  }
  'create-folder': {
    arg: {
      id:string,
      fname:string
    }
    r: number
  }
  'show-file': {
    arg: {
      id: string
      fname: string
    }
    r: void
  }
  'open-skin-folder': {
    arg: {}
    r: void
  }
  'read-osz': {
    arg: {}
    r: { diff?: ChartTypeV2.diff[]; song?: ChartTypeV2.song } | undefined
  }
  'import-from-osz': {
    arg: {}
    r: Promise<void> | undefined
  }
  'import-osz-pics': {
    arg: { id: string }
    r: void
  }
  'export-preview-svg': {
    arg: { id: string; svg_text: string }
    r: void
  }
  'open-dev': {
    arg: {}
    r: void
  }
  'memory-backend': {
    arg: {}
    r: MemoryUsage
  }
  'is-dev': {
    arg: {}
    r: boolean
  }
  'charts-size': {
    arg: {}
    r: Promise<{
      total: number
      detail: [number, string][]
      detail_sf: [number, string][]
      exe: number
      app: number
    }>
  }
  /* The first of arg is the displayed name */
  'ask-file': {
    arg: {
      file: string[]
    }
    r: string | undefined
  }
  'open-file-utf': {
    arg: {
      path: string
    }
    r: string | undefined
  }
  "write-blob": {
    arg: {
      id: string
      fname: string,
      blob: Blob
    }
  }
  'export-for-custom': {
    arg:{
      data: {
        id: string
        diffs: (string|0)[]
        crop?: boolean
        gml: string
        as_id?: string
        sv?: boolean
      }
    }
    r: void
  },
  'set-process-name': {
    arg: {
      name: string
    }
    r: void
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
      def?: string
    }
    r: Promise<string | 0>
  }
  'notify-error': {
    arg: {
      msg: string
      dur: number
    }
    r: void
  }
  'im-closing': {
    arg: {}
    r: void
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
    meter: number
    reverse_scroll: boolean
    lane_width: number

    show_bpm_bottom: boolean
    show_ticks: boolean
    show_bottom_timing: boolean

    // for charting
    offset1: number
    // for playing
    offset2: number
    // for hit-sound
    offset3: number
    record_field: {
      show_bar_text: boolean
      show_beat_line: boolean
      show_bpm_left: boolean
      show_bpm_bottom: boolean
      detail: number
      sprite: boolean
      show_ticks: boolean
      show_circles: boolean
    }

    sprites: {
      bar_length: number
      bar_op: number
      bar_dy: number

      bar_color1: string
      bar_color2: string
      bar_color3: string
      bar_color4: string
      bar_color5: string
    }

    delete_no_confirm: boolean
    time_max_length: number

    judgement: {
      // perfect+
      p1: number
      // perfect, also bomb
      p2: number
      // great
      p3: number
      // good
      p4: number
      // miss-early
      p5: number
    }

    density_data_count: number

    // debug
    mouse_tracker: boolean
    debug_window: boolean

    hit_sound: boolean
    hit_volume: number

    frame_time: boolean

    svg_shown_parts: {
      sprite: boolean
      song: boolean
      diff: boolean
      sv: boolean
      timing: boolean
      tick: boolean
      bar: boolean
    }

    star_rating: boolean
    min_lane: number

    bar_or_section: boolean

    pooling: {
      ahead: number
      behind: number
      count: number
      interval: number
    }

    auto_save: boolean

    exporter: {
      sv: boolean
      crop:boolean
    }
    nearest: number

    sv: {
      show_beat_line: boolean
      beat_line_opacity: number
      pointer_color: string
      pointer_width: number
      beat_line_width: number
      lane_width: number
      lane_width2: number
      threshold: number
      factory_color: string
      factory_opacity: number
    }
  }

  export interface storage_scheme {
    settings: settings
    version: number
    shortcut: string
    username: string
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

export namespace SkinType {
  type skin_position = {
    left?: number
    right?: number
    top?: number
    bottom?: number
    width?: number
  }
  export type skin_object = skin_position &
    (
      | {
          type: 'image'
          src: string
        }
      | {}
    )
  export type skin_data = {
    name: string
    maker: string
    version: string
    pos: {}[]
  }
}
