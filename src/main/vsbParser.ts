class Mod {
  B: number
  D: number
  V1: number
  V2: number
  E: number
  M: string
  P: number

  constructor() {
    this.B = 0
    this.D = 0
    this.V1 = 0
    this.V2 = 0
    this.E = 0
    this.M = ''
    this.P = 0
  }
}

class PerFrame {
  B: number
  E: number
  F: string

  constructor() {
    this.B = 0
    this.E = 0
    this.F = ''
  }
}

class ModData {
  Proxies: number
  Obj: string

  constructor() {
    this.Proxies = 0
    this.Obj = ''
  }
}

class NoteExtra {
  id: number
  value: number

  constructor() {
    this.id = 0
    this.value = 0
  }
}

class Note {
  time: number
  lane: number
  type: number
  extra: NoteExtra[]

  constructor() {
    this.time = 0
    this.lane = 0
    this.type = 0
    this.extra = []
  }
}

class Mods {
  ModList: Mod[]
  PerFrameList: PerFrame[]
  modData: ModData

  constructor() {
    this.ModList = []
    this.PerFrameList = []
    this.modData = new ModData()
  }
}

class VividStasisChart {
  notes: Note[]
  mods: Mods

  constructor() {
    this.notes = []
    this.mods = new Mods()
  }
}

enum EaseType {
  linear = 1,
  outElastic = 2,
  inExpo = 3,
  outExpo = 4,
  inOutExpo = 5,
  inQuad = 6,
  outQuad = 7,
  inOutQuad = 8,
  inCubic = 9,
  outCubic = 10,
  inOutCubic = 11,
  outBack = 12,
  inSine = 13,
  outSine = 14,
  inOutSine = 15,
  outQuart = 16,
  inOutCirc = 17,
  inCirc = 18,
  outCirc = 19
}

enum GlobalModType {
  unknown = 0,
  prx = 1,
  prxb = 2,
  prxc = 3,
  pry = 4,
  pryb = 5,
  pryc = 6,
  prsx = 7,
  pra = 8,
  przm = 9,
  przmb = 10,
  przx = 11,
  przy = 12,
  prrx = 13,
  prry = 14,
  prrz = 15,
  prrzb = 16,
  shxs = 17,
  shxp = 18,
  shxa = 19,
  shys = 20,
  shyp = 21,
  shya = 22,
  scrollspeed = 23,
  noterot = 24,
  velocity = 25,
  spinradius = 26,
  spiny = 27,
  spinx = 28,
  driven = 29,
  beat = 30,
  wave = 31,
  hom = 32,
  przmc = 33,
  prxd = 34,
  pryd = 35,
  prct = 36,
  prcb = 37,
  prcl = 39,
  prcr = 40,
  prvib = 41,
  shct = 42,
  shft = 43,
  shcb = 44,
  shfb = 45,
  shcl = 46,
  shfl = 47,
  shcr = 48,
  shfr = 49
}

export { Mod, PerFrame, ModData, NoteExtra, Note, Mods, VividStasisChart, EaseType, GlobalModType }
import { Buffer } from 'buffer'
import { ChartTypeV2 } from '../preload/types'

class MessageBuffer {
  private buffer: Uint8Array
  private position: number

  constructor(init: Uint8Array) {
    this.buffer = init
    this.position = 0
  }

  get size(): number {
    return this.buffer.length
  }

  setBuffer(buffer: Uint8Array): void {
    this.buffer = buffer
  }

  readByte(): number {
    const val = this.buffer[this.position]
    this.position += 1
    return val
  }

  readSByte(): number {
    const val = this.buffer[this.position]
    this.position += 1
    return val
  }

  readUInt16(): number {
    const val = this.buffer[this.position] | (this.buffer[this.position + 1] << 8)
    this.position += 2
    return val
  }

  readInt16(): number {
    const val = this.buffer[this.position] | (this.buffer[this.position + 1] << 8)
    this.position += 2
    return val
  }

  readUInt32(): number {
    const val =
      this.buffer[this.position] |
      (this.buffer[this.position + 1] << 8) |
      (this.buffer[this.position + 2] << 16) |
      (this.buffer[this.position + 3] << 24)
    this.position += 4
    return val
  }

  readInt32(): number {
    const val =
      this.buffer[this.position] |
      (this.buffer[this.position + 1] << 8) |
      (this.buffer[this.position + 2] << 16) |
      (this.buffer[this.position + 3] << 24)
    this.position += 4
    return val
  }

  readInt64(): bigint {
    const val =
      BigInt(this.buffer[this.position]) |
      (BigInt(this.buffer[this.position + 1]) << BigInt(8)) |
      (BigInt(this.buffer[this.position + 2]) << BigInt(16)) |
      (BigInt(this.buffer[this.position + 3]) << BigInt(24)) |
      (BigInt(this.buffer[this.position + 4]) << BigInt(32)) |
      (BigInt(this.buffer[this.position + 5]) << BigInt(40)) |
      (BigInt(this.buffer[this.position + 6]) << BigInt(48)) |
      (BigInt(this.buffer[this.position + 7]) << BigInt(56))
    this.position += 8
    return val
  }

  readHalf(): number {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.position, 2)
    const value = view.getUint16(0, true)
    this.position += 2
    // Convert half-precision float to single-precision float
    const s = (value & 0x8000) >> 15
    const e = (value & 0x7c00) >> 10
    const f = value & 0x03ff
    if (e === 0) {
      return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10))
    } else if (e === 0x1f) {
      return f !== 0 ? NaN : s ? -Infinity : Infinity
    } else {
      return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / Math.pow(2, 10))
    }
  }

  readFloat(): number {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.position, 4)
    const val = view.getFloat32(0, true)
    this.position += 4
    return val
  }

  readDouble(): number {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.position, 8)
    const val = view.getFloat64(0, true)
    this.position += 8
    return val
  }

  readBoolean(): boolean {
    const val = this.buffer[this.position]
    this.position += 1
    return val === 1
  }

  readString(): string {
    const stringEnd = this.buffer.indexOf(0, this.position) + 1
    const value = Buffer.copyBytesFrom(this.buffer.slice(this.position, stringEnd)).toString(
      'utf-8'
    )
    this.position += value.length
    return value
  }

  readByNoteType(t: number): number {
    if (t === 6) {
      return this.readInt32()
    } else if (t === 8) {
      return this.readFloat()
    }
    return this.readFloat()
    // throw new Error('Unknown type')
  }

  writeByte(val: number): void {
    this.buffer[this.position] = val
    this.position += 1
  }

  writeSByte(val: number): void {
    this.buffer[this.position] = val + 128
    this.position += 1
  }

  writeUInt16(val: number): void {
    this.buffer[this.position] = val & 0xff
    this.buffer[this.position + 1] = (val >> 8) & 0xff
    this.position += 2
  }

  writeInt16(val: number): void {
    this.buffer[this.position] = val & 0xff
    this.buffer[this.position + 1] = (val >> 8) & 0xff
    this.position += 2
  }

  writeUInt32(val: number): void {
    this.buffer[this.position] = val & 0xff
    this.buffer[this.position + 1] = (val >> 8) & 0xff
    this.buffer[this.position + 2] = (val >> 16) & 0xff
    this.buffer[this.position + 3] = (val >> 24) & 0xff
    this.position += 4
  }

  writeInt32(val: number): void {
    this.buffer[this.position] = val & 0xff
    this.buffer[this.position + 1] = (val >> 8) & 0xff
    this.buffer[this.position + 2] = (val >> 16) & 0xff
    this.buffer[this.position + 3] = (val >> 24) & 0xff
    this.position += 4
  }

  writeFloat(val: number): void {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.position, 4)
    view.setFloat32(0, val, true)
    this.position += 4
  }

  writeDouble(val: number): void {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.position, 8)
    view.setFloat64(0, val, true)
    this.position += 8
  }

  writeBoolean(val: boolean): void {
    this.buffer[this.position] = val ? 1 : 0
    this.position += 1
  }

  writeString(val: string): void {
    const encoded = Buffer.from(val, 'utf-8')
    this.writeUInt16(encoded.length)
    for (let i = 0; i < encoded.length; i++) {
      this.buffer[this.position + i] = encoded[i]
    }
    this.position += encoded.length
  }

  readByType(t: number): number | bigint | string | boolean {
    if (t === 0) {
      return this.readByte()
    } else if (t === 1) {
      return this.readSByte()
    } else if (t === 2) {
      return this.readUInt16()
    } else if (t === 3) {
      return this.readInt16()
    } else if (t === 4) {
      return this.readUInt32()
    } else if (t === 5) {
      return this.readInt32()
    } else if (t === 6) {
      return this.readInt32()
    } else if (t === 7) {
      return this.readHalf()
    } else if (t === 8) {
      return this.readFloat()
    } else if (t === 9) {
      return this.readDouble()
    } else if (t === 10) {
      return this.readBoolean()
    } else if (t === 11) {
      return this.readString()
    }
    throw new Error('Unknown Type.')
  }
}

function TypeToBufferType(t: number): number {
  if (t === 176) {
    return 1
  }
  if (t === 177) {
    return 2
  }
  if (t === 178) {
    return 5
  }
  if (t === 179) {
    return 6
  }
  if (t === 181) {
    return 7
  }
  if (t === 182) {
    return 8
  }
  if (t === 183) {
    return 10
  }
  if (t === 184) {
    return 11
  }
  if ([1, 2, 4, 5].includes(t)) {
    return 8
  }
  if ([3, 6].includes(t)) {
    return 1
  }
  if (t === 7) {
    return 2
  }
  return 2
}

function getModNameFromByte(mod: number): string {
  if (mod && 128 === 128) {
    return mod.toString()
  }
  return GlobalModType[mod]
}

function note2width(t: number) {
  switch (t) {
    case 0:
    case 6:
    case 2:
      return 1
    case 1:
    case 7:
    case 8:
      return 2
    default:
      console.log('waht note',t)
      return 0
  }
}

class VsbParser {
  private readonly chart: VividStasisChart
  private reader: MessageBuffer

  constructor(b: Uint8Array | ArrayBuffer) {
    this.chart = new VividStasisChart()
    this.reader = new MessageBuffer(new Uint8Array(b))
  }

  run(): VividStasisChart {
    this.chart.notes = []
    while (true) {
      const flag = this.reader.readByte()
      if (flag === 192) {
        while (true) {
          const flag2 = this.reader.readByte()
          if (flag2 === 160) {
            this.readNote()
          } else if (flag2 === 193) {
            break
          }
        }
      } else if (flag === 224) {
        const modData = new ModData()
        modData.Obj = 'obj_base_gimmick'
        modData.Proxies = 1
        const modList: Mod[] = []
        const perFrameList: PerFrame[] = []
        while (true) {
          const flag3 = this.reader.readByte()
          if (flag3 === 228) {
            modData.Proxies = this.reader.readSByte()
          } else if (flag3 === 229) {
            modData.Obj = this.reader.readString()
          } else if (flag3 === 226) {
            while (true) {
              const flag4 = this.reader.readByte()
              if (flag4 === 223) {
                const m = new Mod()
                m.B = this.reader.readFloat()
                m.D = this.reader.readFloat()
                m.E = this.reader.readSByte()
                m.V1 = this.reader.readFloat()
                m.V2 = this.reader.readFloat()
                m.M = getModNameFromByte(this.reader.readSByte())
                m.P = this.reader.readSByte()
                modList.push(m)
              } else if (flag4 === 236) {
                const p = new PerFrame()
                p.B = this.reader.readFloat()
                p.E = this.reader.readFloat()
                p.F = this.reader.readString()
                perFrameList.push(p)
              } else if (flag4 === 227) {
                break
              }
            }
            this.chart.mods.ModList = modList
            this.chart.mods.PerFrameList = perFrameList
            this.chart.mods.modData = modData
          } else if (flag3 === 225) {
            break
          }
        }
      } else if (flag === 255) {
        break
      }
    }
    return this.chart
  }

  runToNotes(): [ChartTypeV2.note[], ChartTypeV2.timing[]] {
    const n: ChartTypeV2.note[] = []
    const timings: ChartTypeV2.timing[] = []
    this.run().notes.forEach((x) => {
      if (x.type == 4 || x.type == 5) return
      if (x.extra.length > 0 && (x.type == 2 || x.type == 3)) {
        if (x.type == 2)
          n.push({
            time: x.time,
            lane: x.lane,
            len: x.extra[0].value - x.time,
            ani: [],
            width: 1
          })
        else
          timings.push({
            time: x.time,
            bpm: x.extra[0].value,
            num: 4,
            den: 4
          })
        return
      }
      const w = note2width(x.type)
      n.push({
        width: w,
        time: x.time,
        lane: x.lane,
        ani: [],
        snm: x.type == 8 ? 2 : x.type == 6 || x.type == 7 ? 1 : 0
      })
    })
    return [n, timings]
  }

  private readNote(): void {
    const note = new Note()
    while (true) {
      const flag = this.reader.readByte()
      if (flag === 161) {
        break
      }
      if (flag === 162) {
        note.type = this.reader.readSByte()
      } else if (flag === 163) {
        note.lane = this.reader.readSByte()
      } else if (flag === 164) {
        note.time = this.reader.readFloat()
      } else if (flag === 166) {
        const extra: NoteExtra[] = []
        while (true) {
          const type = this.reader.readByte()
          if (type === 167) {
            break
          }
          const id = this.reader.readSByte()
          try {
          const value = this.reader.readByNoteType(TypeToBufferType(type))
          const NE = new NoteExtra()
          NE.id = id
          NE.value = value
          extra.push(NE)

          } catch (e) {
            console.log(type, e)
            break
          }

        }
        note.extra = extra
      }
    }
    this.chart.notes.push(note)
  }
}

export default VsbParser
