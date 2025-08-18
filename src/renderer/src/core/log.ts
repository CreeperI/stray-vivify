import { Ref, ref } from 'vue'

type log = {
  level: "msg" | "err" | "warn" | "debug"
  msg: string
  time: number
}

export const Log = {
  count: ref({
    msg: 0,
    err: 0,
    warn: 0,
    debug: 0,
    all: 0
  }),
  error_list: ref([]) as Ref<log[]>,
  handle() {
    let oldlog = console.log.bind(console)
    console.log = function (...args: any) {
      Log.msg(args.join(" "))
      oldlog(...args)
    }
    let oldwarn = console.warn.bind(console)
    console.warn = function (...args: any) {
      Log.warn(args.join(" "))
      oldwarn(...args)
    }
    let olderr = console.error.bind(console)
    console.error = function (...args: any) {
      Log.err(args.join(" "))
      olderr(...args)
    }
    let olddebug = console.debug.bind(console)
    console.debug = function (...args: any) {
      olddebug(...args)
      Log.debug(args.join(" "))
    }
    window.addEventListener("error", (e) => {
      let msg = ""
      if (e.target instanceof HTMLImageElement) {
        msg += "Image load error: " + e.target.src
      }
      Log.err(msg)
    }, true)
  },
  err(msg: string) {
    this.error_list.value.push({
      level: "err",
      msg,
      time: Date.now()
    })
    this.count.value.err++
  },
  msg(msg: string) {
    this.error_list.value.push({
      level: "msg",
      msg,
      time: Date.now()
    })
    this.count.value.msg++
  },
  warn(msg: string) {
    this.error_list.value.push({
      level: "warn",
      msg,
      time: Date.now()
    })
    this.count.value.warn++
  },
  debug(msg: string) {
    this.error_list.value.push({
      level: "debug",
      msg,
      time: Date.now()
    })
    this.count.value.debug++
  },
}
