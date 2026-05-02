import {
  onMounted,
  onUnmounted,
  watch as VueWatch,
  WatchCallback,
  WatchHandle,
  WatchOptions,
  WatchSource
} from 'vue'

const events = ['audio-time-update', 'fuck-shown'] as const

type eventNames = (typeof events)[number]

class eventHub {
  handlers: Partial<Record<eventNames, (() => void)[]>>
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
}

export const EventHub = new eventHub()

export class StopClass {
  private stop_functions: (() => void)[] = []
  stop() {
    this.stop_functions.forEach((x) => x())
  }
  add_stop(fn: () => void) {
    this.stop_functions.push(fn)
  }
  add_watch(wr: WatchHandle) {
    this.stop_functions.push(() => wr.stop())
  }

  watch(source: WatchSource, cb: WatchCallback, options?: WatchOptions) {
    this.add_watch(VueWatch(source, cb, options))
  }

  add_on(event: eventNames, fn: () => void) {
    this.stop_functions.push(() => EventHub.off(event, fn))
  }
}
