import { Ref, ref } from 'vue'
import { GlobalStat } from '@renderer/core/globalStat'

type log = {
  level: 'msg' | 'err' | 'warn' | 'debug'
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
  need_img: ref([]) as Ref<[string, number][]>,
  handle() {
    if (GlobalStat.is_dev) return
    let oldlog = console.log.bind(console)
    console.log = function (...args: any) {
      oldlog(...args)
      args = args.map((v) => {
        if (typeof v == 'object') return JSON.stringify(v)
        else return v
      })
      Log.msg(args.join(' '))
    }
    let oldwarn = console.warn.bind(console)
    console.warn = function (...args: any) {
      oldwarn(...args)
      args = args.map((v) => {
        if (typeof v == 'object') return JSON.stringify(v)
        else return v
      })
      Log.warn(args.join(' '))
    }
    let olderr = console.error.bind(console)
    console.error = function (...args: any) {
      olderr(...args)
      args = args.map((v) => {
        if (typeof v == 'object') return JSON.stringify(v)
        else return v
      })
      Log.err(args.join(' '))
    }
    let olddebug = console.debug.bind(console)
    console.debug = function (...args: any) {
      olddebug(...args)
      args = args.map((v) => {
        if (typeof v == 'object') return JSON.stringify(v)
        else return v
      })
      Log.debug(args.join(' '))
    }
    window.addEventListener(
      'error',
      (e) => {
        let msg = ''
        if (e.target instanceof HTMLImageElement) {
          const t = e.target
          const src = decodeURIComponent(t.src)
          const ix = this.need_img.value.findIndex((v) => v[0] == src)
          if (ix >= 0) {
            this.need_img.value[ix][1] += 1
          } else {
            this.need_img.value.push([src, 1])
          }
          return
        }
        Log.err(msg)
      },
      true
    )
  },
  err(msg: string) {
    this.error_list.value.push({
      level: 'err',
      msg,
      time: Date.now()
    })
    this.count.value.err++
  },
  msg(msg: string) {
    this.error_list.value.push({
      level: 'msg',
      msg,
      time: Date.now()
    })
    this.count.value.msg++
  },
  warn(msg: string) {
    this.error_list.value.push({
      level: 'warn',
      msg,
      time: Date.now()
    })
    this.count.value.warn++
  },
  debug(msg: string) {
    this.error_list.value.push({
      level: 'debug',
      msg,
      time: Date.now()
    })
    this.count.value.debug++
  }
}
