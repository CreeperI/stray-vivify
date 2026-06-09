import { ChartTypeV2 } from '@preload/chart-types'
import { Storage } from '@renderer/core/storage'

const mul = Storage.computes.mul
export namespace NoteProps {
  const note_style = 'stray:/__skin__'
  export function getSrc(note: ChartTypeV2.note, max = 4): string {
    if (note.width == 0) return ''
    let str = note_style + '/' + note.width
    if (note.width == max) return str + '.png'
    if ('snm' in note) {
      if (note.snm == 1) return str + 'b.png'
      if (note.snm == 2 && note.width != 1) str += 's'
    }
    if (note.width == 1) return str + '.png'
    if (note.width == 2) {
      if (note.lane < (max - note.width) / 3) str += 'l'
      else if (note.lane > ((max - note.width) / 3) * 2) str += 'r'
      else str += 'm'
    }
    if (note.width == 3) {
      if (note.lane < (max - 2) / 2) str += 'l'
      else str += 'r'
    }
    return str + '.png'
  }

  export function borderSrc(note: ChartTypeV2.note, max = 4): string {
    if (note.width == 0) return ''
    let str = note_style + '/' + note.width
    if (note.width == 1) {
      if (note.lane < max / 2) str += 'l'
      else str += 'r'
    }
    if (note.width == 2) {
      if (note.lane < (max - note.width) / 3) str += 'l'
      else if (note.lane > ((max - note.width) / 3) * 2) str += 'r'
      else str += 'm'
    }
    if (note.width == 3) {
      if (note.lane < (max - 2) / 2) str += 'l'
      else str += 'r'
    }
    return str + 'h.png'
  }
}
export class NoteObject {
  index: number
  e: HTMLImageElement
  gold = false
  transparent = false
  note: ChartTypeV2.note
  is_hold: boolean

  constructor(note_index: number, note: ChartTypeV2.note, lane_width: number = -1, max_lane = 4) {
    this.note = note
    this.is_hold = 'len' in note
    this.index = note_index
    this.e = document.createElement('img')
    this.e.src = NoteProps.getSrc(note)
    this.e.alt = `${this.e.src}不见了？`
    this.e.classList.add('note-v2')
    if ('snm' in note) this.set_css_note(lane_width)
    else this.set_css_ln(lane_width, max_lane)

    this.e.setAttribute('data-shown-note', '')
  }
  set_css_note(lane_width: number) {
    if ('snm' in this.note) {
      this.e.style.cssText = [
        `z-index: ${9 - this.note.width}`,
        `width: ${lane_width * this.note.width}px`,
        `left: ${this.note.lane * lane_width + 56}px`
      ].join(';')
    }
  }
  set_css_ln(lane_width: number, max_lane: number) {
    if ('len' in this.note) {
      const sliceHeight = 43
      const width = this.note.len * mul.value - 0.5 * sliceHeight
      const borderSrc = NoteProps.borderSrc(this.note, max_lane)
      this.e.style.cssText = [
        `z-index: ${9 - this.note.width}`,
        `width: ${lane_width * this.note.width}px`,
        `left: ${this.note.lane * lane_width + 56}px`,
        // LN things
        'border: none',
        `border-top: transparent solid ${width}px`,
        'border-image-repeat: stretch',
        `border-image-slice: ${sliceHeight}`,
        `border-image-source: url(${borderSrc})`,
        `height: ${43 * (lane_width / 130)}px`
      ].join(';')
    }
  }

  update_position(t: number, offset1: number) {
    const y = (this.note.time - t - offset1) * mul.value
    this.e.style.transform = `translateY(${-y}px)`
  }

  set_gold(v: boolean) {
    if (v) this.e.style.boxShadow = '0 0 15px gold'
    else this.e.style.boxShadow = ''
    this.gold = v
  }

  set_transparent(v: boolean) {
    if (v) this.e.style.opacity = '0'
    else this.e.style.opacity = ''
    this.transparent = v
  }
  unmount() {
    this.e.remove()
  }
}
