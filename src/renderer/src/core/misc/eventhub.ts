import {
  onMounted,
  onUnmounted,
  watch as VueWatch,
  WatchCallback,
  WatchHandle,
  WatchOptions,
  WatchSource
} from 'vue'

const events = ['audio-time-update', 'fuck-shown', 'scale-changed', 'meter-changed'] as const

type eventNames = (typeof events)[number]

class eventHub {
  handlers: Partial<Record<eventNames, (() => void)[]>>
  paused = false
  constructor() {
    this.handlers = {}
  }

  on(event: eventNames, fn: () => void) {
    if (this.handlers[event]) {
      this.handlers[event].push(fn)
    } else this.handlers[event] = [fn]
    return () => this.off(event, fn)
  }
  dispatch(event: eventNames) {
    if (this.paused) return
    if (this.handlers[event]) {
      this.handlers[event].forEach((x) => x())
    }
  }
  off(event: eventNames, fn: () => void) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter((x) => x !== fn)
    }
  }
  use(event: eventNames, fn: () => void) {
    onMounted(() => EventHub.on(event, fn))
    onUnmounted(() => EventHub.off(event, fn))
  }
  pause() {
    this.paused = true
  }
  resume() {
    this.paused = false
  }
}

export const EventHub = new eventHub()

export class StopClass {
  static all: StopClass[] = []
  private stop_functions: (() => void)[] = []
  constructor() {
    StopClass.all.push(this)
  }
  stop() {
    console.log('stopclass terminated', this)
    this.stop_functions.forEach((x) => x())
  }
  add_stop(fn: () => void) {
    this.stop_functions.push(fn)
  }
  add_watch(wr: WatchHandle) {
    this.stop_functions.push(() => wr.stop())
  }

  watch<T>(source: WatchSource<T>, cb: WatchCallback<T>, options?: WatchOptions) {
    this.add_watch(VueWatch(source, cb, options))
  }

  add_on(event: eventNames, fn: () => void) {
    EventHub.on(event, fn)
    this.stop_functions.push(() => EventHub.off(event, fn))
  }
}
