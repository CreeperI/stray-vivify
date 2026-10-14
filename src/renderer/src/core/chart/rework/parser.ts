/**
 * MMA `js/parser/osuFileParser.js` (+ `js/parser/noteColumn.js`) 的逐行移植。
 *
 * 只做两件移植层面的改动：
 *   1. 包进 `Rework_Parser` namespace；
 *   2. 除保留 `process()`（.osu 文本路径，Roxy/ETT 将来需要）外，新增
 *      `parseFromSource()` —— 直接把已转换好的音符表灌进同一份状态，
 *      避免为了 Sunny/Daniel/pattern 走一次文本往返。
 *
 * 所有数值逻辑、字段名、方法名与顺序保持原样。
 */
export namespace Rework_Parser {
  /** 把整数 x 映射到列（`js/parser/noteColumn.js: xToColumn`） */
  export function xToColumn(x: number, keys: number): number {
    let col = Math.trunc((x / 512.0) * keys)
    if (col < 0) col = 0
    if (col > keys - 1) col = keys - 1
    return col
  }

  export type HitObject =
    | { kind: 'HitCircle'; X: number; Time: number; EndTime?: undefined }
    | { kind: 'Hold'; X: number; Time: number; EndTime: number }

  export type TimingPoint =
    | {
        kind: 'Uninherited'
        Time: number
        MsPerBeat: number
        Meter: number
        Multiplier?: undefined
      }
    | {
        kind: 'Inherited'
        Time: number
        Multiplier: number
        MsPerBeat?: undefined
        Meter?: undefined
      }

  /** 已解析完成的谱面状态（等价于 `process()` 跑完之后的实例字段） */
  export type Source = {
    keys: number
    od: number
    gameMode: string | null
    status: string
    hitObjects: HitObject[]
    timingPoints: TimingPoint[]
    metaData?: Record<string, string>
    breaks?: number[][]
  }

  function stringToInt(value: string): number {
    return Math.trunc(Number.parseFloat(value))
  }

  function bisectRight(arr: number[], target: number): number {
    let lo = 0
    let hi = arr.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (arr[mid] <= target) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }
    return lo
  }

  export class OsuFileParser {
    osuText: string
    od: number
    columnCount: number
    columns: number[]
    noteStarts: number[]
    noteEnds: number[]
    noteTypes: number[]
    gameMode: any
    status: string
    lnRatio: number
    noteTimes: any
    metaData: any
    breaks: any[]
    objectIntervals: any[]
    timingPoints: any[]

    constructor(osuText: string) {
      this.osuText = osuText
      this.od = -1
      this.columnCount = -1
      this.columns = []
      this.noteStarts = []
      this.noteEnds = []
      this.noteTypes = []
      this.gameMode = null
      this.status = 'init'
      this.lnRatio = 0
      this.noteTimes = {}
      this.metaData = {}
      this.breaks = []
      this.objectIntervals = []
      this.timingPoints = []
    }

    getParsedData() {
      return {
        columnCount: this.columnCount,
        columns: this.columns,
        noteStarts: this.noteStarts,
        noteEnds: this.noteEnds,
        noteTypes: this.noteTypes,
        od: this.od,
        gameMode: this.gameMode,
        status: this.status,
        lnRatio: this.lnRatio,
        metaData: this.metaData,
        breaks: this.breaks,
        objectIntervals: this.objectIntervals
      }
    }

    process() {
      const lines = this.osuText.split(/\r?\n/)

      let inMetadataSection = false
      let inEventsSection = false
      let inTimingSection = false

      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i].trim()
        if (!line) {
          continue
        }

        if (line === '[Metadata]') {
          inMetadataSection = true
          inEventsSection = false
          inTimingSection = false
          continue
        }
        if (line === '[Events]') {
          inMetadataSection = false
          inEventsSection = true
          inTimingSection = false
          continue
        }
        if (line === '[TimingPoints]') {
          inMetadataSection = false
          inEventsSection = false
          inTimingSection = true
          continue
        }
        if (line.startsWith('[') && line.endsWith(']')) {
          inMetadataSection = false
          inEventsSection = false
          inTimingSection = false
        }

        if (inMetadataSection && line.includes(':')) {
          const splitIdx = line.indexOf(':')
          const key = line.slice(0, splitIdx).trim()
          const value = line.slice(splitIdx + 1).trim()
          this.metaData[key] = value
        }

        if (inEventsSection) {
          this.parseEventLine(line)
        }

        if (inTimingSection) {
          this.parseTimingPointLine(line)
        }

        if (line.includes('OverallDifficulty:')) {
          const odPart = line.split(':')[1]
          if (odPart != null) {
            const parsed = Number.parseFloat(odPart.trim())
            if (!Number.isNaN(parsed)) this.od = parsed
          }
        }

        if (line.includes('CircleSize:')) {
          const csPart = line.split(':')[1]
          if (csPart != null) {
            const cs = csPart.trim()
            this.columnCount = cs === '0' ? 10 : stringToInt(cs)
          }
        }

        if (line.includes('Mode:')) {
          const modePart = line.split(':')[1]
          if (modePart != null) {
            const mode = modePart.trim()
            this.gameMode = mode
            if (mode !== '3') {
              this.status = 'NotMania'
            }
          }
        }

        if (line === '[HitObjects]') {
          for (let j = i + 1; j < lines.length; j += 1) {
            const objLine = lines[j].trim()
            if (!objLine) continue
            this.parseHitObject(objLine)
          }
          break
        }
      }

      this.finalize()
    }

    /** process() 尾部与 parseFromSource() 共用的收尾（顺序与原文件一致） */
    finalize() {
      this.lnRatio = this.getLNRatio()
      this.noteTimes = this.getNoteTimes()
      this.objectIntervals = this.getObjectIntervals()

      if (!this.timingPoints.length) {
        this.timingPoints = [[0, 500.0]]
      }
      this.timingPoints.sort((a, b) => a[0] - b[0])

      if (this.status !== 'Fail' && this.status !== 'NotMania') {
        this.status = 'OK'
      }
    }

    parseEventLine(eventLine: string) {
      if (!eventLine || eventLine.startsWith('//')) return

      const params = eventLine.split(',').map((part) => part.trim())
      if (params.length < 3) return

      if (params[0] !== '2' && params[0] !== 'Break') return

      const breakStart = Number.parseInt(params[1], 10)
      const breakEnd = Number.parseInt(params[2], 10)
      if (Number.isNaN(breakStart) || Number.isNaN(breakEnd)) return

      if (breakEnd > breakStart) {
        this.breaks.push([breakStart, breakEnd])
      }
    }

    parseHitObject(objectLine: string) {
      const params = objectLine.split(',')
      if (params.length < 5) return

      try {
        const x = stringToInt(params[0])
        let column = 0
        if (this.columnCount > 0) {
          column = xToColumn(x, this.columnCount)
        }
        this.columns.push(column)

        const noteStart = Number.parseInt(params[2], 10)
        const noteType = Number.parseInt(params[3], 10)
        this.noteStarts.push(noteStart)
        this.noteTypes.push(noteType)

        let noteEnd = noteStart
        if ((noteType & 128) !== 0 && params.length >= 6) {
          const lastParamChunk = params[5].split(':')
          noteEnd = Number.parseInt(lastParamChunk[0], 10)
        }
        this.noteEnds.push(noteEnd)
      } catch {
        this.status = 'Fail'
      }
    }

    parseTimingPointLine(timingLine: string) {
      if (!timingLine || timingLine.startsWith('//')) return

      const parts = timingLine.split(',').map((item) => item.trim())
      if (parts.length < 2) return

      const t = Math.trunc(Number.parseFloat(parts[0]))
      const beatLength = Number.parseFloat(parts[1])
      const uninherited = parts.length > 6 && parts[6] ? Number.parseInt(parts[6], 10) : 1

      if (!Number.isNaN(t) && !Number.isNaN(beatLength) && uninherited === 1 && beatLength > 0) {
        this.timingPoints.push([t, beatLength])
      }
    }

    getBeatLengthAt(timeMs: number) {
      if (!this.timingPoints.length) return 500.0
      const times = this.timingPoints.map((tp: any) => tp[0])
      const idx = bisectRight(times, Math.trunc(timeMs)) - 1
      if (idx < 0) return this.timingPoints[0][1]
      return this.timingPoints[idx][1]
    }

    getLNRatio() {
      const totalNotes = this.noteTypes.length
      if (!totalNotes) return 0
      let lnCount = 0
      for (const t of this.noteTypes) {
        if ((t & 128) !== 0) lnCount += 1
      }
      return lnCount / totalNotes
    }

    getColumnCount() {
      return this.columnCount
    }

    getNoteTimes() {
      const noteTimes: any = {}
      for (let i = 0; i < this.columns.length; i += 1) {
        const col = this.columns[i]
        const time = this.noteStarts[i]
        if (!noteTimes[col]) noteTimes[col] = []
        noteTimes[col].push(time)
      }

      for (const key of Object.keys(noteTimes)) {
        noteTimes[key].sort((a: number, b: number) => a - b)
      }

      return noteTimes
    }

    getObjectIntervals() {
      if (!this.noteStarts.length) return []

      const sortedStarts = [...this.noteStarts].sort((a, b) => a - b)
      const intervals: any[] = []
      let prevStart: number | null = null
      for (const startTime of sortedStarts) {
        const interval = prevStart == null ? 0 : startTime - prevStart
        intervals.push([startTime, interval])
        prevStart = startTime
      }

      intervals.sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        return a[0] - b[0]
      })

      return intervals
    }

    modIN() {
      const startsByCol: any = {}
      for (let i = 0; i < this.columns.length; i += 1) {
        const col = this.columns[i]
        const start = this.noteStarts[i]
        if (!startsByCol[col]) startsByCol[col] = []
        startsByCol[col].push(Number(start))
      }

      const newObjects: any[] = []
      for (const colText of Object.keys(startsByCol)) {
        const col = Number.parseInt(colText, 10)
        const locations = startsByCol[col]

        locations.sort((a: number, b: number) => a - b)

        for (let i = 0; i < locations.length - 1; i += 1) {
          const startTime = locations[i]
          const nextTime = locations[i + 1]
          let duration = nextTime - startTime
          const beatLength = this.getBeatLengthAt(nextTime)
          duration = Math.max(duration / 2, duration - beatLength / 4)
          const endTime = startTime + duration

          newObjects.push([Math.round(startTime), col, Math.round(endTime)])
        }
      }

      newObjects.sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0]
        return a[1] - b[1]
      })

      this.columns = newObjects.map((obj) => obj[1])
      this.noteStarts = newObjects.map((obj) => obj[0])
      this.noteTypes = newObjects.map(() => 128)
      this.noteEnds = newObjects.map((obj) => obj[2])
      this.breaks = []
      this.lnRatio = this.getLNRatio()
      this.noteTimes = this.getNoteTimes()
      this.objectIntervals = this.getObjectIntervals()
    }

    modHO() {
      for (let i = 0; i < this.noteTypes.length; i += 1) {
        if ((this.noteTypes[i] & 128) !== 0) {
          this.noteTypes[i] = 1
          this.noteEnds[i] = 0
        }
      }

      this.lnRatio = this.getLNRatio()
      this.noteTimes = this.getNoteTimes()
      this.objectIntervals = this.getObjectIntervals()
    }
  }

  /**
   * 把已转换好的音符表灌进 parser 状态（跳过文本往返）。
   * 字段与「解析等价 .osu 文本」的结果对齐：columns/noteStarts/noteTypes/noteEnds
   * 由 hitObjects 直接写入，lnRatio/noteTimes/objectIntervals/timingPoints 走同一批
   * 内部方法（`finalize()`），因此与文本路径同公式同顺序。
   */
  export function parseFromSource(src: Source): OsuFileParser {
    const p = new OsuFileParser('')
    p.columnCount = src.keys
    p.od = src.od
    p.gameMode = src.gameMode
    p.status = src.status
    p.metaData = { ...(src.metaData ?? {}) }
    p.breaks = (src.breaks ?? []).map((b) => [...b])

    for (const obj of src.hitObjects) {
      p.columns.push(xToColumn(obj.X, src.keys))
      p.noteStarts.push(obj.Time)
      const isHold = obj.kind === 'Hold' && obj.EndTime > obj.Time
      p.noteTypes.push(isHold ? 128 : 1)
      p.noteEnds.push(isHold ? (obj as any).EndTime : obj.Time)
    }

    for (const tp of src.timingPoints) {
      if (tp.kind === 'Uninherited' && Number.isFinite(tp.MsPerBeat) && tp.MsPerBeat > 0) {
        p.timingPoints.push([Math.trunc(tp.Time), tp.MsPerBeat])
      }
    }

    p['finalize']()
    return p
  }
}
