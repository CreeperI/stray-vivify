class _IntervalClass {
  func: [number, (() => any)[]][]
  private time_ids: [number, number][]
  private pending_intervals: Set<number>
  private paused: boolean
  constructor() {
    this.func = []
    this.time_ids = []
    this.pending_intervals = new Set<number>()
    this.paused = false
  }

  on(interval: number, fn: () => any) {
    const funcs = this.func.find((x) => x[0] == interval)
    if (funcs) funcs[1].push(fn)
    else {
      this.func.push([interval, [fn]])
      this.start_interval(interval)
    }
  }

  off(int: number, fn: () => any) {
    const funcs = this.func.find((x) => x[0] == int)
    if (funcs) {
      const index = funcs[1].indexOf(fn)
      if (index > -1) funcs[1].splice(index, 1)
    }
    if (funcs && funcs[1].length == 0) {
      this.func = this.func.filter((x) => x[0] != int)
      clearInterval(this.time_ids.find((x) => x[0] == int)?.[1])
      this.time_ids = this.time_ids.filter((x) => x[0] != int)
    }
  }

  call_interval(interval: number) {
    if (this.paused) {
      this.pending_intervals.add(interval)
      return
    }
    const f = this.func.find((x) => x[0] == interval)
    if (f) f[1].forEach((fn) => fn())
  }

  pause() {
    this.paused = true
  }
  resume() {
    this.paused = false
    this.pending_intervals.forEach((interval) => {
      this.call_interval(interval)
    })
    this.pending_intervals.clear()
  }

  private start_interval(interval: number) {
    const x = this
    this.time_ids.push([
      interval,
      // @ts-expect-error fuck you typescript this is a NUMBER
      setInterval(() => x.call_interval(interval), interval)
    ])
  }
}
export const Intervals = new _IntervalClass()
