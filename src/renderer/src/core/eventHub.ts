export const Events = ['update', 'save-diff', 'save-chart'] as const
export type Events = (typeof Events)[number]

interface EventHub {
  handlers: Partial<Record<Events, (() => void)[]>>

  on(event: Events, handler: () => void): void

  clear(event: Events): void

  emit(event: Events): void
}

export const EventHub: EventHub = {
  handlers: {},
  on(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = []
    }
    this.handlers[event].push(handler)
  },
  clear(event) {
    if (this.handlers[event]) {
      this.handlers[event] = []
    }
  },
  emit(event: Events) {
    if (this.handlers[event]) {
      this.handlers[event].forEach((v) => v())
    }
  }
}
