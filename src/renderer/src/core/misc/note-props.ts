import { ChartTypeV2 } from '@preload/chart-types'

export namespace NoteProps {
  const note_style = 'stray:/__skin__'
  export function getSrc(note: ChartTypeV2.note, max = 4): string {
    return note_style + '/' + base_src(note, max)
  }
  export function base_src(note: ChartTypeV2.note, max = 4): string {
    if (note.width == 0) return ''
    let str = note.width + ''
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
    return note_style + '/' + base_border_src(note, max)
  }
  export function base_border_src(note: ChartTypeV2.note, max = 4): string {
    if (note.width == 0) return ''
    let str = note.width + ''
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
