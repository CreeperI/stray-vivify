import { ElementGroup } from '@renderer/core/misc/element-group'
import { ms } from '@renderer/core/chart/chart'
import { Storage } from '@renderer/core/storage'
import { ChartTypeV2 } from '@preload/chart-types'

export namespace diff_elements {
  export function create_bartext() {
    return new ElementGroup(null, (line: [ms, number]) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('dy', '-1rem')
      text.setAttribute('fill', '#ffffff')
      text.setAttribute('opacity', '0.5')
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('font-size', '1.2rem')
      text.setAttribute('x', '25')
      text.textContent = String(line[1] + 1)
      return text
    })
  }
  export function create_beatline() {
    const color_of_level = (lvl: number): string => {
      return Storage.settings.sprites['bar_color' + lvl] ?? '#ffffff'
    }
    return new ElementGroup(null, ([_, lvl]: [ms, number]) => {
      const ele = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      ele.setAttribute('stroke', color_of_level(lvl))
      ele.setAttribute('x1', '50')
      return ele
    })
  }

  export function create_section() {
    return new ElementGroup(null, ([_, idx]: [ms, number]) => {
      const ele = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      ele.setAttribute('dy', '-1rem')
      ele.setAttribute('fill', '#ffffff')
      ele.setAttribute('opacity', '0.5')
      ele.setAttribute('text-anchor', 'middle')
      ele.setAttribute('font-size', '1.2rem')
      ele.setAttribute('x', '25')
      ele.textContent = Storage.settings.bar_from_0 ? String(idx) : String(idx + 1)
      return ele
    })
  }

  export function create_bpm() {
    return new ElementGroup(null, (timing: ChartTypeV2.timing) => {
      const ele = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      ele.setAttribute('fill', '#b8dcee')
      ele.setAttribute('text-anchor', 'middle')
      ele.setAttribute('font-size', '1rem')
      ele.setAttribute('x', '25')
      ele.textContent = timing.bpm.toString().slice(0, 6)
      return ele
    })
  }

  export function create_tick() {
    return new ElementGroup(null, (tick: [ms, number]) => {
      if (tick[1] == 0) return null
      const ele = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      ele.setAttribute('fill', 'gray')
      ele.setAttribute('text-anchor', 'middle')
      ele.textContent = `.${tick[1]}`
      return ele
    })
  }
}
