import { utils } from '@renderer/core/utils'

export class ElementGroup<T extends Element, createFrom> {
  elements: [T, createFrom][]
  createElement: (arg: createFrom) => T | null
  parent: Element | null
  mounted: boolean
  constructor(parent: Element | null, create: (arg: createFrom) => T | null) {
    this.elements = []
    this.createElement = create
    this.parent = parent
    this.mounted = false
  }
  recreate(...arg: createFrom[]) {
    this.unmount()
    utils.clear_arr(this.elements)
    arg.forEach((v) => {
      const el = this.createElement(v)
      if (el) this.elements.push([el, v])
    })
    this.mount()
  }
  unmount() {
    this.elements.forEach((v) => {
      v[0].remove()
    })
    this.mounted = false
  }
  update(fn: (arg: [T, createFrom]) => void) {
    if (!this.mounted) return
    this.elements.forEach((v) => fn(v))
  }
  mount(parent?: Element | null) {
    if (parent) this.parent = parent
    if (!this.parent) return
    this.elements.forEach((v) => {
      this.parent!.appendChild(v[0])
    })
    this.mounted = true
  }
}
