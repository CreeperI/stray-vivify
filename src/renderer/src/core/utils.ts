import { ChartTypeV2 } from '@preload/types'
import { ref } from 'vue'

export namespace utils {
  /** return whether a value is between the given states */
  export function between(val: number, vs: [number, number]): boolean {
    let [v1, v2] = vs
    if (v1 > v2) [v1, v2] = [v2, v1] // Ensure v1 < v2
    return val >= v1 && val <= v2
  }

  export function remove<T>(arr: T[], v: T) {
    arr.splice(arr.indexOf(v), 1)
  }

  export function round(val: number, digit = 0) {
    return Math.round(val * 10 ** digit) / 10 ** digit
  }

  export function deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      const copy: any[] = []
      for (let i = 0; i < obj.length; i++) {
        copy[i] = deepCopy(obj[i])
      }
      return copy as T
    }

    const copy: { [key: string]: any } = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = deepCopy(obj[key])
      }
    }
    return copy as T
  }

  // 同意领吗写的，不管了
  export function assign<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }

    const to = Object(target)

    for (const source of sources) {
      if (source != null) {
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key]
            const targetValue = to[key]

            if (
              typeof sourceValue === 'object' &&
              sourceValue !== null &&
              !Array.isArray(sourceValue)
            ) {
              if (
                typeof targetValue === 'object' &&
                targetValue !== null &&
                !Array.isArray(targetValue)
              ) {
                to[key] = assign(
                  {} as Record<Extract<keyof T, string>, unknown>,
                  targetValue,
                  sourceValue
                )
              } else {
                to[key] = assign({} as Record<Extract<keyof T, string>, unknown>, sourceValue)
              }
            } else {
              to[key] = sourceValue
            }
          }
        }
      }
    }

    return to
  }

  // only update value if there is sth accordingly in target
  export function less_assign<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }
    const to = Object(target)

    for (const source of sources) {
      if (source != null) {
        for (const key in source) {
          if (key in target) {
            // noinspection DuplicatedCode
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              const sourceValue = source[key]
              const targetValue = to[key]

              if (
                typeof sourceValue === 'object' &&
                sourceValue !== null &&
                !Array.isArray(sourceValue)
              ) {
                if (
                  typeof targetValue === 'object' &&
                  targetValue !== null &&
                  !Array.isArray(targetValue)
                ) {
                  to[key] = assign(
                    {} as Record<Extract<keyof T, string>, unknown>,
                    targetValue,
                    sourceValue
                  )
                } else {
                  to[key] = assign({} as Record<Extract<keyof T, string>, unknown>, sourceValue)
                }
              } else {
                to[key] = sourceValue
              }
            }
          }
        }
      }
    }

    return to
  }

  export function guard<T>(val: any, ini: T): T {
    if (typeof val != typeof ini) return ini
    else return val
  }

  export function clear_arr(arr: any[]) {
    while (arr.length) arr.pop()
  }

  export function sort_notes(a: ChartTypeV2.note, b: ChartTypeV2.note) {
    return a.time - b.time // 按时间排序
  }

  export function around(v1: number, v2: number, gap = 20) {
    return Math.abs(v1 - v2) <= gap
  }

  export function random<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  export function toTimeStr(seconds: number, fix = 3) {
    const isNegative = seconds < 0
    const absSeconds = Math.abs(seconds)
    const minutes = Math.floor(absSeconds / 60)
    let secs = (absSeconds % 60).toFixed(fix)

    // 处理秒数部分补零逻辑
    if (minutes == 0) {
      return (isNegative ? '-' : '') + secs
    }
    secs = parseFloat(secs) < 10 ? '0' + secs : secs
    // 添加负号标识
    return (isNegative ? '-' : '') + minutes + ':' + secs
  }

  export function ms2str(ms: number, fix = 3) {
    return toTimeStr(ms / 1000, fix)
  }

  export function average(arr: number[]) {
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  export function shallow_assign<T>(target: Required<T>, source: Partial<T>) {
    for (const key of keyof(source)) {
      target[key] = JSON.parse(JSON.stringify(source[key]))
    }
  }

  export function keyof<T extends object>(obj: T) {
    return Object.keys(obj) as (keyof T)[]
  }
  export function range(...args: number[]) {
    return Math.max(...args) - Math.min(...args)
  }
  export function timer(cb: () => void) {
    const r0 = performance.now()
    cb()
    return performance.now() - r0
  }
  export function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve))
  }

  const note_style = 'stray:/__skin__'

  export function getSrc(note: ChartTypeV2.note, max = 4): string {
    if (note.width == 0) return ''
    let str = note_style + '/' + note.width
    if ('snm' in note) {
      if (note.snm == 1) return str + 'b.png'
      if (note.snm == 2 && note.width != 1) str += 's'
    }
    if (note.width == 1) return str + '.png'
    if (note.lane < (max - note.width) / 3) str += 'l'
    else if (note.lane > ((max - note.width) / 3) * 2) str += 'r'
    else str += 'm'

    return str + '.png'
  }

  export function borderSrc(note: ChartTypeV2.note, max = 4): string {
    let str = note_style + '/' + note.width
    if (note.width == 1) {
      if (note.lane < max / 2) str += 'l'
      else str += 'r'
    } else {
      if (note.lane < max / 3) str += 'l'
      else if (note.lane > (max / 3) * 2) str += 'r'
      else str += 'm'
    }
    return str + 'h.png'
  }

  export const refresh_key = ref('')
  export function refresh() {
    refresh_key.value = Math.random().toString().slice(0, 7)
  }
}

// @ts-expect-error
window.utils = utils
