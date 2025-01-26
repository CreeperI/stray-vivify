// typings.ts

type json_data = {
  [key: string]: number | string | boolean
}

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

  static fromJson(data: json_data): Mod {
    const mod = new Mod()
    mod.B = Number(data.B)
    mod.D = Number(data.D)
    mod.V1 = Number(data.V1)
    mod.V2 = Number(data.V2)
    mod.E = Number(data.E)
    mod.M = String(data.M)
    mod.P = Number(data.P)
    return mod
  }

  dump() {
    return {
      B: this.B,
      D: this.D,
      V1: this.V1,
      V2: this.V2,
      E: this.E,
      M: this.M,
      P: this.P
    }
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

  static fromJson(data: json_data): PerFrame {
    const perFrame = new PerFrame()
    perFrame.B = Number(data.B)
    perFrame.E = Number(data.E)
    perFrame.F = String(data.F)
    return perFrame
  }

  dump() {
    return {
      B: this.B,
      E: this.E,
      F: this.F
    }
  }
}

class ModData {
  Proxies: number
  Obj: string

  constructor() {
    this.Proxies = 0
    this.Obj = ''
  }

  static fromJson(data: json_data): ModData {
    const modData = new ModData()
    modData.Proxies = Number(data.Proxies)
    modData.Obj = String(data.Obj)
    return modData
  }

  dump() {
    return {
      Proxies: this.Proxies,
      Obj: this.Obj
    }
  }
}

class NoteExtra {
  id: number
  value: number

  constructor() {
    this.id = 0
    this.value = 0
  }

  static fromJson(data: json_data): NoteExtra {
    const noteExtra = new NoteExtra()
    noteExtra.id = Number(data.id)
    noteExtra.value = Number(data.value)
    return noteExtra
  }

  dump() {
    return {
      id: this.id,
      value: this.value
    }
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

  static fromJson(data: json_data): Note {
    const note = new Note()
    note.time = Number(data.time)
    note.lane = Number(data.lane)
    note.type = Number(data.type)
    if (Array.isArray(data.extra)) {
      for (const extra of data.extra) {
        note.extra.push(NoteExtra.fromJson(extra as json_data))
      }
    }
    return note
  }

  dump() {
    return {
      time: this.time,
      lane: this.lane,
      type: this.type,
      extra: this.extra.map((extra) => extra.dump())
    }
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
