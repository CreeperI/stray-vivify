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
  }

  export type hold_note = {
    time: number
    lane: number
    width: number
    len: number
  }
  export type note = normal_note | hold_note

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
  }
  export type meta = {
    charter: string
    diff1: string
    diff2: string
    diff_name: string
  }
  export type mod = {
    time: number
    // repeat-count
    repeat: number
    // time between two starts
    step: number
    duration: number
    easing: string
    value1: number
    value2: number
    modname: string
    proxy: number
  }

  export type mpf = {
    time: number
    end: number
    func: string
  }
  export type vsm = {
    obj: string
    proxies: number
    mpfs: mpf[]
    mods: mod[]
    name: string
  }

  export type final = {
    diffs: diff[]
    song: song
    vsm: vsm[]
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
    lvl: "pure" | "perfect+" | "great+" | "good+" | "miss+" | "boom!" | "perfect-" | "great-" | "good-" | "miss-"
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
