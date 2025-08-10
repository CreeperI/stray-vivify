type events = "resize" | "update"

export const Listener = {
  handlers: {} as Partial<Record<events,(()=> void)[]>>,
  on(event:events, fn: () => void) {
    if (this.handlers[event]) {
      this.handlers[event].push(fn)
    }
    else this.handlers[event] = [fn]
  },
  trigger(e:events) {
    if (this.handlers[e]) {
      this.handlers[e]?.forEach(x => x())
    }
  },
  off(event:events, fn: () => void) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter(x => x != fn)
    }
  }
}
