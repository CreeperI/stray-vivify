import {ComponentProps} from "vue-component-type-helpers";
import {Ref, ref} from "vue";

let nextModalID = 0

const queue: modal[] = []

export class modal<T = any> {

  // static current: modal | undefined = undefined
  // static currentRef = ref(false)
  static _current : modal | undefined = undefined
  static get current() {
    return this._current
  }
  static set current(val) {
    this._current = val
    this.current_ref.value = val
  }
  static current_ref: Ref<undefined| modal> = ref(undefined)
  component: T;
  priority: number;
  props: ComponentProps<T> | undefined
  uniqueID: number

  constructor(component: T, priority = 0) {
    this.component = component;
    this.props = undefined
    this.priority = priority
    this.uniqueID = -1
  }

  static hide() {
    queue.shift()
    this.sortModalQueue()
  }

  static sortModalQueue() {
    const modalQueue = queue
    modalQueue.sort((x, y) => y.priority - x.priority)
    const singleQueue = [...new Set(modalQueue)]
    while (queue.length > 0) {
      queue.shift()
    }
    queue.push(...singleQueue)
    this.current = queue[0]
  }

  show(props: ComponentProps<T>) {
    this.uniqueID = nextModalID++
    this.props = Object.assign({}, props)

    queue.unshift(this)
    modal.sortModalQueue()
  }
}
declare global {
  interface Window {
    modal: typeof modal
  }
}
window.modal = modal
