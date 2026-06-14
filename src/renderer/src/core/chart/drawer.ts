import {
  Application,
  ApplicationOptions,
  Container,
  ContainerOptions,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  TextStyle
} from 'pixi.js'
import { ChartTypeV2 } from '@preload/chart-types'
import { toRaw } from 'vue'
import { Storage } from '@renderer/core/storage'
import { StopClass } from '@renderer/core/misc/eventhub'
import { NoteProps } from '@renderer/core/chart/note-object'
import { Chart_diff } from '@renderer/core/chart/diff'
import { Chart } from '@renderer/core/chart/chart'
import { GlobalStat } from '@renderer/core/globalStat'
import { Skin } from '@renderer/core/misc/skin'
import getTexture = Skin.getTexture

const mul = Storage.computes.mul

export const SCREEN_HEIGHT = window.screen.height

export class DrawerExtension<T extends Sprite | Text | Graphics, createFrom> extends StopClass {
  elements: Map<createFrom, T>
  createSprite: (arg: createFrom) => T | null
  container: Container<T>
  visible: boolean
  constructor(
    createSprite: (arg: createFrom) => T | null,
    containOption?: Partial<ContainerOptions>
  ) {
    super()
    this.elements = new Map()
    // @ts-ignore wtf
    this.container = new Container<T>({ cullable: true, ...containOption })
    this.createSprite = createSprite
    this.visible = true
  }
  recreate(...arg: createFrom[]) {
    this.remove()
    arg.forEach((v) => {
      const el = this.createSprite(v)
      if (el) {
        this.elements.set(v, el)
        this.container.addChild(el)
      }
    })
  }

  /*recreate(...arg: createFrom[]) {
    const oldKeys = new Set(this.elements.keys())
    const newKeys = new Set(arg)

    const toRemove = [...oldKeys].filter((k) => !newKeys.has(k))
    const toAdd = [...newKeys].filter((k) => !oldKeys.has(k))

    toRemove.forEach((key) => {
      const el = this.elements.get(key)
      if (el) {
        this.container.removeChild(el)
        el.destroy()
        this.elements.delete(key)
      }
    })

    toAdd.forEach((key) => {
      const el = this.createSprite(key)
      if (el) {
        this.elements.set(key, el)
        this.container.addChild(el)
      }
    })
  }*/
  update(fn: (value: T, key: createFrom) => void) {
    if (!this.visible) return
    this.elements.forEach(fn)
  }
  reparent(parent: Container<T>) {
    this.elements.forEach((v) => {
      parent.reparentChild(v)
    })
    this.container = parent
  }
  remove() {
    this.container.removeChild(...this.container.children)
    this.elements.forEach((sprite) => {
      sprite.destroy()
    })
    this.elements.clear()
  }
}

export namespace NoteDrawer {
  export function createNote(this: DiffDrawer, note: ChartTypeV2.note) {
    const texture = getTexture(NoteProps.base_src(note, 4))
    if (!texture) return null
    const sprite = new Sprite({
      texture,
      label: `${note.time}:${note.lane}`
    })
    sprite.x = this.x_of(note.lane)
    sprite.y = 0
    sprite.width = Storage.settings.lane_width * note.width
    sprite.zIndex = 4 - note.width
    return sprite
  }
  export function createLn(this: DiffDrawer, note: ChartTypeV2.note) {
    if ('snm' in note) return null
    const border_texture = getTexture(NoteProps.base_border_src(note, 4))
    if (!border_texture) return null
    const border = new Sprite({
      texture: border_texture,
      label: String(note.time)
    })
    border.x = this.x_of(note.lane)
    border.height = note.len * mul.value - 0.5 * Skin.BaseHeight
    border.y = this.get_y_ln(note.time, this.chart.audio.current_time, mul.value, note.len)
    return border
  }
}

export class DiffDrawer extends StopClass {
  diff: Chart_diff
  chart: Chart
  app: Application
  sizing: {
    lane_width: number
    total_width: number
    x_expand: number
  }
  drawers: {
    notes: DrawerExtension<Sprite, ChartTypeV2.note>
    ln: DrawerExtension<Sprite, ChartTypeV2.note>
    beat: DrawerExtension<Graphics, [number, number]>
    left_text: DrawerExtension<Text, [number, number]>
    bpm_text: DrawerExtension<Text, ChartTypeV2.timing>
    tick: DrawerExtension<Text, [number, number]>
  }
  max_lane: number

  constructor(
    diff: Chart_diff,
    sizing: { lane_width: number; total_width: number; x_expand: number }
  ) {
    super()
    this.diff = diff
    this.chart = diff.chart
    this.app = new Application()
    this.sizing = sizing
    this.max_lane = diff.max_lane.value

    /* drawer inits */
    {
      const note_drawer = new DrawerExtension(
        (note: ChartTypeV2.note) => {
          return NoteDrawer.createNote.apply(this, [note])
        },
        { label: 'note', zIndex: 10 }
      )

      const ln_drawer = new DrawerExtension(
        (note: ChartTypeV2.note) => {
          return NoteDrawer.createLn.apply(this, [note])
        },
        { label: 'ln', zIndex: 9, cullable: false }
      )
      const _lix_text_style = new TextStyle({
        fill: 'white',
        fontFamily: 'Arial',
        fontSize: GlobalStat.rem,
        dropShadow: {},
        align: 'center'
      })
      const Lix_drawer = new DrawerExtension(([_ms, ix]: [number, number]) => {
        const _ix = Storage.settings.bar_from_0 ? ix : ix + 1
        const t = new Text({ text: String(_ix), style: _lix_text_style })
        t.anchor = 0.5
        t.x = 25
        return t
      })

      const _color_of_level = (lvl: number): string => {
        return Storage.settings.sprites['bar_color' + lvl] ?? '#ffffff'
      }
      const beat_drawer = new DrawerExtension(
        ([_ms, lvl]: [number, number]) => {
          const g = new Graphics()
            .rect(
              0,
              0,
              sizing.total_width - sizing.x_expand - 100,
              Storage.settings.sprites.bar_length
            )
            .fill(_color_of_level(lvl))
          g.x = 50
          g.width = sizing.total_width - sizing.x_expand - 100
          g.height = Storage.settings.sprites.bar_length
          return g
        },
        { label: 'beat', zIndex: 1 }
      )
      const _bpm_text_style = new TextStyle({
        fill: 'pink',
        fontFamily: 'Arial',
        fontSize: GlobalStat.rem,
        dropShadow: {},
        align: 'center'
      })
      const bpm_text_drawer = new DrawerExtension<Text, ChartTypeV2.timing>(
        (timing) => {
          const t = new Text({ text: String(timing.bpm), style: _bpm_text_style })
          t.anchor = 0.5
          t.x = 25
          return t
        },
        { label: 'bpm_text' }
      )
      const _tick_text_style = new TextStyle({
        fontFamily: 'Arial',
        align: 'left',
        fontSize: GlobalStat.rem,
        fill: 'white',
        dropShadow: {}
      })
      const tick_drawer = new DrawerExtension(
        ([_ms, tick]: [number, number]) => {
          if (tick < 2) return null
          const t = new Text({ text: `.${tick}`, alpha: 0.7, style: _tick_text_style })
          t.anchor = { x: 0, y: 0.5 }
          t.x = 50 + this.max_lane * this.sizing.lane_width + 15
          return t
        },
        { label: 'tick' }
      )
      this.drawers = {
        notes: note_drawer,
        ln: ln_drawer,
        beat: beat_drawer,
        left_text: Lix_drawer,
        bpm_text: bpm_text_drawer,
        tick: tick_drawer
      }
    }
    /* decoration line */
    this.create_decoration()
    this.app.stage.addChild(
      this.drawers.beat.container,
      this.drawers.ln.container,
      this.drawers.notes.container,
      this.drawers.left_text.container,
      this.drawers.bpm_text.container,
      this.drawers.tick.container
    )

    this.add_on('audio-time-update', () => this.update())
    this.add_on('scale-changed', () => {
      this.ln_reheight()
      this.update()
    })
    // here as diff_index will trigger shown
    this.add_on('fuck-shown', () => {
      this.try_resize()
      this.recreate()
    })
    this.add_on('meter-changed', () => {
      this.drawers.beat.recreate(...this.diff.shown_timing_list.beat_list)
      this.update()
    })
  }

  create_decoration() {
    const decoration = new Container({ label: 'decorations', zIndex: 999 })
    decoration.addChild(
      new Graphics().rect(50, SCREEN_HEIGHT - 80, this.sizing.total_width - 100, 80).fill('gray')
    )

    decoration.addChild(new Graphics().rect(44, 0, 6, SCREEN_HEIGHT).fill('white'))
    decoration.addChild(
      new Graphics().rect(this.sizing.total_width - 50, 0, 6, SCREEN_HEIGHT).fill('white')
    )

    decoration.addChild(
      new Graphics().rect(50, SCREEN_HEIGHT - 80, this.sizing.total_width - 100, 6).fill('white')
    )
    this.app.stage.addChild(decoration)
  }

  get_y(t: number, c: number, m: number) {
    return SCREEN_HEIGHT - (t - c - Storage.settings.offset1) * m - 80 - Skin.BaseHeight
  }

  get_height_ln(len: number, m: number) {
    return len * m - 0.5 * Skin.BaseHeight
  }

  get_y_ln(t: number, c: number, m: number, len: number) {
    return this.get_y(t, c, m) - this.get_height_ln(len, m)
  }

  get_y_line(t: number, c: number, m: number) {
    return (
      SCREEN_HEIGHT -
      (t - c - Storage.settings.offset1) * m +
      (Skin.BaseWidth / 130) * (Skin.BaseHeight / 2) -
      80 -
      Skin.BaseHeight
    )
  }

  update() {
    const time = this.chart.audio.current_time
    const m = mul.value
    const to_note = this.diff.to_note
    this.drawers.notes.update((sprite, i) => {
      sprite.y = this.get_y(to_note(i).time, time, m)
    })
    this.drawers.ln.update((sprite, i) => {
      const ln = to_note(i) as ChartTypeV2.hold_note
      sprite.y = this.get_y_ln(ln.time, time, m, ln.len)
    })
    const beat_dy = Storage.settings.sprites.bar_dy
    this.drawers.beat.update((g, [ms, _]) => {
      g.y = this.get_y_line(ms, time, m) + beat_dy
    })
    this.drawers.left_text.update((t, [ms, _]) => {
      t.y = this.get_y_line(ms, time, m)
    })
    this.drawers.bpm_text.update((t, timing) => {
      t.y = this.get_y_line(timing.time, time, m) + GlobalStat.rem
    })
    this.drawers.tick.update((t, [ms, _]) => {
      t.y = this.get_y_line(ms, time, m)
    })
  }

  recreate() {
    this.drawers.notes.recreate(...toRaw(this.diff.shown))
    this.drawers.ln.recreate(...toRaw(this.diff.shown))
    this.drawers.beat.recreate(...this.diff.shown_timing_list.beat_list)
    if (Storage.settings.bar_or_section)
      this.drawers.left_text.recreate(...this.diff.shown_timing_list.section_list)
    else this.drawers.left_text.recreate(...this.diff.shown_timing_list.bar_list)

    this.drawers.bpm_text.recreate(...this.diff.shown_timing)
    this.drawers.tick.recreate(...this.diff.shown_timing_list.ticks)
  }

  ln_reheight() {
    const to_note = this.diff.to_note
    this.drawers.ln.update((g, i) => {
      const note = to_note(i) as ChartTypeV2.hold_note
      g.height = note.len * mul.value
    })
  }

  x_of(lane: number) {
    return lane * this.sizing.lane_width + 50
  }

  init(options: Partial<ApplicationOptions>) {
    this.setculling()
    return this.app.init({ ...options, height: SCREEN_HEIGHT })
  }

  setculling() {
    this.app.stage.cullable = true
    this.app.stage.cullArea = new Rectangle(0, 0, this.sizing.total_width, SCREEN_HEIGHT)
  }

  event_time(eY: number) {
    const t =
      (SCREEN_HEIGHT - eY - 0.5 * Skin.height(this.sizing.lane_width) - 80) / mul.value +
      this.chart.audio.current_time
    if (GlobalStat.func_keys.value.alt) return t
    else return this.diff.nearest(t, true)
  }

  resize() {
    const ml = this.diff.max_lane.value
    this.sizing.total_width = this.sizing.x_expand + ml * this.sizing.lane_width + 100
    this.app.renderer.resize(this.sizing.total_width, SCREEN_HEIGHT)
    const old = this.app.stage.getChildByLabel('decorations')
    if (old) this.app.stage.removeChild(old)
    if (this.app.canvas)
      if (this.app.canvas.parentElement)
        this.app.canvas.parentElement.style.width = `${this.sizing.total_width}px`
    this.create_decoration()
    this.setculling()
  }

  try_resize() {
    if (this.diff.max_lane.value != this.max_lane) {
      this.max_lane = this.diff.max_lane.value
      this.resize()
    }
  }
}
