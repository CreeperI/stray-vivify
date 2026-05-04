import {
  onMounted,
  onUnmounted,
  watch as VueWatch,
  WatchCallback,
  WatchHandle,
  WatchOptions,
  WatchSource
} from 'vue'
import { GlobalStat } from '@renderer/core/globalStat'

const events = ['audio-time-update', 'fuck-shown', 'scale-changed', 'meter-changed'] as const

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
    if (GlobalStat.is_dev) console.log("Eventhub dispatched:", event)
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
    console.log("stopclass terminated", this)
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
    EventHub.on(event, fn)
    this.stop_functions.push(() => EventHub.off(event, fn))
  }
}
