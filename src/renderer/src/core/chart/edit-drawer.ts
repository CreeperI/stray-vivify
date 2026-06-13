import { Chart, event_time } from '@renderer/core/chart/chart'
import { NoteProps } from '@renderer/core/chart/note-object'
import { BlurFilter, FederatedPointerEvent, Graphics, Sprite } from 'pixi.js'
import { Storage } from '@renderer/core/storage'
import { DiffDrawer, DrawerExtension } from '@renderer/core/chart/drawer'
import { ChartTypeV2 } from '@preload/chart-types'
import { GlobalStat } from '@renderer/core/globalStat'
import { toRaw } from 'vue'
import { notify } from '@renderer/core/misc/notify'
import { utils } from '@renderer/core/utils'
import { Chart_diff } from '@renderer/core/chart/diff'
import { Skin } from '@renderer/core/misc/skin'

const getTexture = Skin.getTexture

const { clipboard, selected } = GlobalStat.NoteClipboard
const mul = Storage.computes.mul

class Pending {
  diff_drawer: DiffDrawer
  chart: Chart
  diff: Chart_diff
  drawer: {
    note: DrawerExtension<Sprite, ChartTypeV2.note>
    ln: DrawerExtension<Sprite, ChartTypeV2.note>
  }
  hold_fixed = false
  hold_fixed_time = 0
  dragging: boolean
  dragging_base_time = 0
  dragging_base_lane = 0
  dragging_delta = 0
  dragging_notes: ChartTypeV2.note[] = []
  pre_drag = false
  dragging_width = 0

  constructor(diff_drawer: DiffDrawer, chart: Chart) {
    this.diff_drawer = diff_drawer
    this.chart = chart
    this.diff = chart.diff
    this.dragging = false
    const pending_note_drawer = new DrawerExtension(
      (note: ChartTypeV2.note) => {
        const texture = getTexture(NoteProps.base_src(note, 4))
        const sprite = new Sprite({
          texture,
          label: `${note.time}:${note.lane}`
        })
        sprite.x = this.diff_drawer.x_of(note.lane)
        sprite.y = this.diff_drawer.get_y(note.time, chart.audio.current_time, mul.value)
        sprite.width = Storage.settings.lane_width * note.width
        sprite.zIndex = 4 - note.width
        return sprite
      },
      { label: 'pending_note', zIndex: 11, alpha: 0.7 }
    )
    const pending_ln_drawer = new DrawerExtension(
      (note: ChartTypeV2.note) => {
        if ('snm' in note) return null
        const border_texture = getTexture(NoteProps.base_border_src(note, 4))
        const border = new Sprite({
          texture: border_texture,
          label: String(note.time)
        })
        border.x = this.diff_drawer.x_of(note.lane)
        border.height = note.len * mul.value - 0.5 * Skin.BaseHeight
        border.y = this.diff_drawer.get_y_ln(
          note.time,
          chart.audio.current_time,
          mul.value,
          note.len
        )
        return border
      },
      { label: 'pending_ln', zIndex: 10, alpha: 0.7 }
    )
    this.drawer = {
      note: pending_note_drawer,
      ln: pending_ln_drawer
    }
    this.diff_drawer.add_on('scale-changed', () => {
      this.update_pending()
    })
    this.diff_drawer.add_on('audio-time-update', () => this.update_pending())
  }

  get select() {
    return !!selected.value.length
  }

  get snm() {
    return Storage.note.snm
  }

  set snm(v: number) {
    Storage.note.set_snm(v)
    this.recreate()
  }

  _time: number = 0

  get time() {
    return this._time
  }

  set time(v: number) {
    this._time = v
    this.update_pending()
  }

  _lane: number = 0

  get lane() {
    return this._lane
  }

  set lane(v: number) {
    this._lane = v
    this.recreate()
  }

  _len: number = 0

  get len() {
    return this._len
  }

  set len(v: number) {
    this._len = v
  }

  _display: boolean = false

  get display() {
    return this._display
  }

  set display(v: boolean) {
    this._display = v
    this.update_display()
  }

  get pending_note(): ChartTypeV2.note[] {
    if (this.dragging) {
      const to_note = this.diff.to_note
      return this.dragging_notes.map((ix) => {
        const note = to_note(ix)
        return {
          ...note,
          time: this.time + (note.time - this.dragging_base_time) - this.dragging_delta,
          lane: this.lane + (note.lane - this.dragging_base_lane)
        }
      })
    }
    if (Storage.note.w == 0) return []
    if (Storage.note.h)
      return [{ time: this.time, lane: this.lane, width: Storage.note.w, len: this.len }]
    else return [{ time: this.time, lane: this.lane, width: Storage.note.w, snm: this.snm }]
  }

  get is_hold() {
    return Storage.note.h
  }

  get pending_width() {
    if (this.dragging) return this.dragging_width
    else return Storage.note.w
  }

  update_pending() {
    this.drawer.note.update((g, note) => {
      g.x = this.diff_drawer.x_of(note.lane)
      g.y = this.diff_drawer.get_y(note.time, this.chart.audio.current_time, mul.value)
    })
    this.drawer.ln.update((g, note) => {
      g.x = this.diff_drawer.x_of(note.lane)
      g.y = this.diff_drawer.get_y_ln(
        note.time,
        this.chart.audio.current_time,
        mul.value,
        utils.get_len(note)
      )
    })
  }

  recreate() {
    this.drawer.note.recreate(...this.pending_note)
    this.drawer.ln.recreate(...this.pending_note)
  }

  update_display(v?: boolean) {
    if (!v) v = this._display
    this.drawer.note.container.visible = v
    this.drawer.ln.container.visible = v
  }

  on_click(e: FederatedPointerEvent) {
    if (GlobalStat.chart_state.value != 0) return
    if (clipboard.value.length) return
    if (Storage.note.w == 0) {
      if (selected.value && !e.ctrlKey) {
        GlobalStat.NoteClipboard.clear()
      }
      return
    }

    if (Storage.note.hold.value) {
      if (this.hold_fixed) {
        if (!this.diff.add_notes_with_undo(this.pending_note)) notify.error('添加note失败。')
        this.len = 0
        this.hold_fixed = false
        this.hold_fixed_time = 0
      } else {
        this.hold_fixed = true
        this.hold_fixed_time = this.time
      }
      return
    } else {
      if (!this.diff.add_notes_with_undo(this.pending_note)) notify.error('添加note失败。')
    }
  }

  /** trigger on mousedown */
  pre_drag_start() {
    this.pre_drag = true
    console.log('pre-drag-start')
  }

  pre_drag_end() {
    this.pre_drag = false
    console.log('pre-drag-end')
  }

  /* trigger on mousemove */
  drag_start(ix: number) {
    if (!this.pre_drag) return
    if (this.dragging) return
    console.log('drag-start')

    this.dragging = true
    const to_note = this.diff.to_note
    if (this.select) {
      if (selected.value.includes(ix)) {
        this.dragging_notes = toRaw(selected.value).map((x) => to_note(x))
      }
    } else this.dragging_notes = [to_note(ix)]
    this.dragging_base_lane = Math.min(...this.dragging_notes.map((x) => to_note(x).lane))
    this.dragging_base_time = Math.min(...this.dragging_notes.map((x) => to_note(x).time))
    this.dragging_delta = to_note(ix).time - this.dragging_base_time
    this.dragging_width = utils.range(
      ...this.dragging_notes
        .map((n) => {
          return [n.lane, n.lane + n.width]
        })
        .flat()
    )
    this.hold_fixed = false
    this.len = 0
    this.update_dragging_visible()
    this.recreate()
    console.log()
  }

  cancel_drag() {
    this.dragging = false
    this.pre_drag = false
    this.dragging_base_time = 0
    this.dragging_base_lane = 0
    this.dragging_notes = []
    this.dragging_delta = 0
    this.dragging_width = 0
    this.update_dragging_visible()
    this.recreate()
  }

  drop() {
    if (!this.dragging) return
    console.log('drop')
    if (!this.diff.remove_note_with_undo(...this.dragging_notes)) {
      notify.error('删除note失败。')
      return this.cancel_drag()
    }
    if (!this.diff.add_notes_with_undo(this.pending_note)) {
      notify.error('添加note失败。')
    }
    this.cancel_drag()
  }

  update_dragging_visible() {
    const to_note = this.diff.to_note
    const x = this.dragging
      ? (g: Sprite, ix: number) => (g.visible = !this.dragging_notes.includes(to_note(ix)))
      : (g: Sprite) => (g.visible = true)

    this.diff_drawer.drawers.notes.update(x)
    this.diff_drawer.drawers.ln.update(x)
  }
}
class Shadow {
  drawer: DrawerExtension<Graphics, number>
  diff_drawer: DiffDrawer
  diff: Chart_diff
  chart: Chart
  width: number
  constructor(diff_drawer: DiffDrawer, width = 2) {
    this.width = width
    this.chart = diff_drawer.diff.chart
    this.diff = diff_drawer.diff
    this.diff_drawer = diff_drawer
    const to_note = diff_drawer.diff.to_note
    const lane_width = diff_drawer.sizing.lane_width
    this.drawer = new DrawerExtension(
      (i: number) => {
        const note = to_note(i)
        const gh = this.shadow_height(note)
        const gw = lane_width * note.width + 2 * width
        const g = new Graphics().rect(0, 0, gw, gh).fill('gold')
        g.x = this.diff_drawer.x_of(note.lane) - 10
        return g
      },
      {
        label: 'shadow',
        zIndex: 5,
        filters: [new BlurFilter({ strength: 5 })]
      }
    )
  }
  shadow_height(note: ChartTypeV2.note) {
    if ('len' in note) return note.len * mul.value + 0.5 * Skin.BaseHeight + 2 * this.width
    else return Skin.BaseHeight + 2 * this.width
  }
  update() {
    const c = this.chart.audio.current_time
    const m = mul.value
    this.drawer.update((g, i) => {
      const note = this.diff_drawer.diff.to_note(i)
      g.x = this.diff_drawer.x_of(note.lane) - this.width
      if ('len' in note) g.y = this.diff_drawer.get_y_ln(note.time, c, m, note.len) - this.width
      else g.y = this.diff_drawer.get_y(note.time, c, m) - this.width
    })
  }
  recreate() {
    this.drawer.recreate(...toRaw(selected.value))
    this.update()
  }
  update_scale() {
    this.drawer.update((g, i) => {
      const note = this.diff_drawer.diff.to_note(i)
      g.height = this.shadow_height(note)
      if ('len' in note)
        g.y =
          this.diff_drawer.get_y_ln(note.time, this.chart.audio.current_time, mul.value, note.len) -
          this.width
      else
        g.y =
          this.diff_drawer.get_y(note.time, this.chart.audio.current_time, mul.value) - this.width
    })
  }
  hide() {
    this.drawer.container.visible = false
  }
  show() {
    this.drawer.container.visible = true
  }
}
export function editable_note_drawer(this: DiffDrawer, chart: Chart) {
  const diff = chart.diff
  const { lane_width } = this.sizing

  function change_select(n: number) {
    if (selected.value.includes(n)) {
      selected.value = selected.value.filter((x) => x != n)
    } else {
      selected.value.push(n)
    }
    shadow.recreate()
  }
  function del_note(n: number) {
    if (pending.hold_fixed) return
    if (selected.value.includes(n)) {
      diff.remove_note_with_undo(...selected.value)
      utils.clear_arr(selected.value)
      return
    }
    if (!diff.remove_note_with_undo(to_note(n))) notify.error('删除note失败。')
  }

  const to_note = chart.diff.to_note
  function _handle(sprite: Sprite, i: number) {
    sprite.on('click', (ev) => {
      if (ev.ctrlKey) {
        change_select(i)
        ev.stopPropagation()
      }
    })
    sprite.on('mousedown', (ev) => {
      if (!ev.ctrlKey && !ev.altKey) pending.pre_drag_start()
    })
    sprite.on('rightclick', () => del_note(i))
    sprite.on('mousemove', () => {
      // show at pixi-editor
      if (pending.pre_drag) shadow.drawer.remove()
      pending.drag_start(i)
    })
    sprite.on('mouseup', () => {
      pending.pre_drag_end()
    })
    sprite.eventMode = 'static'
  }
  const note_drawer = new DrawerExtension(
    (i: number) => {
      const note = to_note(i)
      const texture = getTexture(NoteProps.base_src(note, 4))
      const sprite = new Sprite({
        texture,
        label: `${note.time}:${note.lane}`
      })
      sprite.x = this.x_of(note.lane)
      sprite.y = 0
      sprite.width = Storage.settings.lane_width * note.width
      sprite.zIndex = 4 - note.width

      _handle(sprite, i)

      return sprite
    },
    { label: 'editor-note', zIndex: 10 }
  )
  const ln_drawer = new DrawerExtension(
    (i: number) => {
      const note = to_note(i)
      if ('snm' in note) return null
      const border_texture = getTexture(NoteProps.base_border_src(note, 4))
      const border = new Sprite({
        texture: border_texture,
        label: String(note.time)
      })
      border.x = this.x_of(note.lane)
      border.height = note.len * mul.value - 0.5 * Skin.BaseHeight
      _handle(border, i)
      border.eventMode = 'static'
      return border
    },
    { label: 'editor-ln', zIndex: 9, cullable: false }
  )
  const shadow = new Shadow(this)

  const listen_handle = () => {
    this.add_on('audio-time-update', () => {
      shadow.update()
    })
    this.add_on('fuck-shown', () => {
      const v = toRaw(diff.shown.value)
      note_drawer.recreate(...v)
      ln_drawer.recreate(...v)
      this.update()
    })
    this.add_on('scale-changed', () => {
      shadow.update_scale()
    })
  }
  const pending = new Pending(this, chart)
  function update_pending(e: MouseEvent) {
    if (GlobalStat.chart_state.value != 0) return
    if (!chart.audio.paused) return
    const mouse_time = event_time(e, chart, mul.value, chart.audio.current_time)
    if (pending.hold_fixed) {
      pending.len = Math.abs(mouse_time - pending.hold_fixed_time)
      if (mouse_time <= pending.hold_fixed_time) {
        // so the user is 倒着拉条
        pending.time = pending.hold_fixed_time - pending.len
      }
      return
    }
    // this is initial value referring the % of the mouse
    const max_lane = diff.max_lane.value
    let lane: number = utils.clamp((e.offsetX - 50) / (max_lane * lane_width), 0, 1)
    const width = pending.pending_width
    lane = utils.clamp(Math.floor(lane * (diff.max_lane.value - width + 1)), 0, max_lane - width)

    pending.time = mouse_time
    pending.lane = lane
    pending.snm = Storage.note.snm

    pending.display = pending.time >= 0
    pending.update_pending()
  }
  function mousein() {
    pending.display = chart.audio.paused
  }
  function mouseout() {
    pending.display = false
  }
  utils.stopWatch(chart.audio.refs.paused, (v) => (pending.display = v))

  return {
    note_drawer,
    ln_drawer,
    shadow,
    pending: pending,
    mousein,
    mouseout,
    listen_handle,
    update_pending
  }
}
