import { Charter } from '@renderer/core/charter'
import { Settings } from '@renderer/core/Settings'

const functions = [
  'redo',
  'undo',
  'delete',
  'copy',
  'paste',
  'cut',
  'dev',
  'pause',

  'scale-up',
  'scale-down',

  'w1',
  'w2',
  'w3',
  'w4',
  's',
  'mine',
  'hold'
] as const

type SC_save = {
  name: (typeof functions)[number]
  key: string
  alt: boolean
  ctrl: boolean
  shift: boolean
}

export class ShortCuts {
  static all: ShortCuts[] = []
  name: (typeof functions)[number]
  private _alt: boolean
  private _ctrl: boolean
  private _shift: boolean
  private readonly cb: (e?: KeyboardEvent) => any

  constructor(
    name: (typeof functions)[number],
    k: string,
    cb: (e?: KeyboardEvent) => any,
    alt = false,
    ctrl = false,
    shift = false
  ) {
    this.name = name
    this._key = k
    this._alt = alt
    this._ctrl = ctrl
    this._shift = shift
    this.cb = cb
    ShortCuts.all.push(this)
  }

  private _key: string

  get key() {
    return this._key
  }

  get data() {
    return {
      name: this.name,
      key: this.key,
      alt: this._alt,
      ctrl: this._ctrl,
      shift: this._shift
    }
  }

  static exists(k: string, alt = false, ctrl = false, shift = false) {
    return (
      ShortCuts.all.find((x) => {
        return x.is(k, alt, ctrl, shift)
      }) != undefined
    )
  }

  static handle(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement) return
    ShortCuts.all.forEach((x) => {
      x.handle(e)
    })
  }

  static fun(fn: (typeof functions)[number]) {
    return this.all.find((x) => x.name == fn)
  }

  static $fun(fn: (typeof functions)[number]) {
    const x = this.all.find((x) => x.name == fn)
    if (!x) throw new Error()
    return x
  }

  static toJson(): SC_save[] {
    return ShortCuts.all.map((x) => {
      return {
        name: x.name,
        key: x.key,
        alt: x._alt,
        ctrl: x._ctrl,
        shift: x._shift
      }
    })
  }

  /** @param data {SC_save} */
  static fromJson(data: any) {
    const x = ShortCuts.all.find((x) => x.name == data.name)
    if (!x) return
    x.set_key(data.key, data.alt, data.ctrl, data.shift)
  }

  static async load_from_storage() {
    const data = await Charter.invoke('get-shortcut-data')
    if (!data) return
    const parsed = JSON.parse(data) as SC_save[]
    if (!parsed) return
    parsed.forEach((x) => {
      ShortCuts.fromJson(x)
    })
  }

  set_key(k: string, alt = false, ctrl = false, shift = false) {
    if (ShortCuts.exists(k, alt, ctrl, shift)) {
    }
    this._key = k
    this._ctrl = ctrl
    this._alt = alt
    this._shift = shift
    Charter.update()
  }

  is(k: string, alt = false, ctrl = false, shift = false) {
    return this.key == k && this._alt == alt && this._ctrl == ctrl && this._shift == shift
  }

  handle(e: KeyboardEvent) {
    if (this.is(e.key, e.altKey, e.ctrlKey, e.shiftKey)) {
      this.cb(e)
      console.log(this.name)
    }
  }

  parse() {
    const l: string[] = []
    if (this._ctrl) l.push('Ctrl')
    if (this._alt) l.push('Alt')
    if (this._shift) l.push('Shift')
    l.push(this.key)
    return l.join('+')
  }

  set_data(data: SC_save) {
    this.name = data.name
    this.set_key(data.key, data.alt, data.ctrl, data.shift)
    Charter.update()
  }
}

new ShortCuts('redo', 'y', () => Charter.if_current()?.diff.execute_redo(), false, true)
new ShortCuts('undo', 'z', () => Charter.if_current()?.diff.execute_undo(), false, true)

new ShortCuts('w1', '1', () => Settings.note.set_width(1))
new ShortCuts('w2', '2', () => Settings.note.set_width(2))
new ShortCuts('w3', '3', () => Settings.note.set_width(3))
new ShortCuts('w4', '4', () => Settings.note.set_width(4))
new ShortCuts('s', 'q', () => Settings.note.change_s())
new ShortCuts('mine', 'w', () => Settings.note.change_b())
new ShortCuts('hold', 'e', () => Settings.note.change_hold())
new ShortCuts('pause', ' ', () => Charter.if_current()?.audio.play_pause())
