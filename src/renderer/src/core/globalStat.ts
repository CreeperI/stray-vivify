import { inject, reactive, Ref, ref, watch } from 'vue'
import { charts_data, ChartTypeV2 } from '@preload/types'
import { Invoke } from '@renderer/core/ipc'
import { Storage } from '@renderer/core/storage'
import { utils } from '@renderer/core/utils'
import { modal } from '@renderer/core/modal'

export namespace GlobalStat {
  type routes = 'start' | 'wait' | 'editor'
  export const route = {
    route: ref('start' as routes),
    change(p: routes) {
      this.route.value = p
    }
  }
  export let all_chart = [] as charts_data
  export const all_chart_ref = ref(all_chart)
  export async function update_all_chart() {
    all_chart = (await Invoke('get-charts-data')).sort((a, b) => b.last_open - a.last_open)
    all_chart_ref.value = all_chart
  }
  export const window_max_state = ref(false)
  export function log(...args: any) {
    for (const arg of args) {
      console.log(JSON.stringify(arg))
    }
  }
  export const window_size = {
    height: screen.availHeight,
    width: screen.availWidth
  }
  export const refs = {
    chart_tab: ref(2),
    header_display: ref(''),
    window: {
      height: ref(screen.height),
      width: ref(screen.width)
    }
  }
  // 0 - charting 1 - recording 2 - playing
  export const chart_state = ref(0) as Ref<0 | 1 | 2>
  export function set_state(v: 0 | 1 | 2) {
    chart_state.value = v
  }

  export namespace WordHelper {
    export const position = ref([0, 0])
    export const word = ref('')
    export const shown = ref(false)

    export function call_helper(pos: [number, number], w: string) {
      position.value = pos
      word.value = w
      shown.value = true
    }

    export function hide_helper() {
      shown.value = false
      word.value = ''
    }
  }

  export namespace MouseTracker {
    export const mouse_pos = ref({ x: 0, y: 0 })
    function listener(e: MouseEvent) {
      mouse_pos.value = { x: e.clientX, y: e.clientY }
    }
    export function init() {
      watch(
        () => Storage.data.value.settings.mouse_tracker,
        (v) => {
          if (v) {
            document.addEventListener('mousemove', listener)
            document.documentElement.classList.add('no-cursor')
          } else {
            document.removeEventListener('mousemove', listener)
            document.documentElement.classList.remove('no-cursor')
          }
        },
        { immediate: true }
      )
    }
  }

  export namespace CheckSkin {
    import keyof = utils.keyof
    export const status = reactive({
      '1.png': 0,
      '1b.png': 0,
      '1lh.png': 0,
      '1rh.png': 0,
      '2b.png': 0,
      '2l.png': 0,
      '2lh.png': 0,
      '2m.png': 0,
      '2mh.png': 0,
      '2r.png': 0,
      '2rh.png': 0,
      '2sl.png': 0,
      '2sm.png': 0,
      '2sr.png': 0,
      '3b.png': 0,
      '3l.png': 0,
      '3lh.png': 0,
      '3r.png': 0,
      '3rh.png': 0,
      '3sl.png': 0,
      '3sr.png': 0,
      '4.png': 0,
      '4b.png': 0,
      '4h.png': 0,
      '4s.png': 0
    })

    export async function check_skin() {
      let is_missing = false
      for (const key of keyof(status)) {
        try {
          await fetch('stray:/__skin__/' + key)
          status[key] = 2
        } catch (e) {
          is_missing = true
          status[key] = 1
        }
      }
      if (is_missing) {
        modal.MissingSkinModal.show({})
      }
    }
  }

  class _IntervalClass {
    func: [number, (() => any)[]][]
    private time_ids: [number, number][]
    constructor() {
      this.func = []
      this.time_ids = []
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

    private start_interval(interval: number) {
      this.time_ids.push([
        interval,
        // @ts-expect-error fuck you typescript this is a NUMBER
        setInterval(() => {
          const f = this.func.find((x) => x[0] == interval)
          if (f) f[1].forEach((fn) => fn())
        }, interval)
      ])
    }
  }
  export const Intervals = new _IntervalClass()

  export namespace MemoryUsage {
    export interface MemoryInfo {
      jsHeapSizeLimit: number
      totalJSHeapSize: number
      usedJSHeapSize: number
    }
    export const backend = ref({
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      arrayBuffers: 0
    })
    export const frontend = ref({
      jsHeapSizeLimit: 0,
      totalJSHeapSize: 0,
      usedJSHeapSize: 0
    })
    export function update() {
      Invoke('memory-backend').then((r) => {
        backend.value = r
      })
      frontend.value = (performance as any).memory as MemoryInfo
    }
  }

  export namespace NoteClipboard {
    export const selected = ref<ChartTypeV2.note[]>([])
    export const clipboard = ref<ChartTypeV2.note[]>([])

    export function clear() {
      clipboard.value = []
      selected.value = []
    }
    export let copy = () => {}
    export let cut = () => {}
    export let paste = () => {}
  }

  export let is_dev = false
  export async function check_dev() {
    is_dev = await Invoke('is-dev')
  }

  export namespace ChartSize {
    export const data = ref({
      total: 0,
      detail: [] as [number, string][],
      detail_sf: [] as [number, string][],
      exe: 0,
      app: 0
    })

    export async function update() {
      data.value = await Invoke('charts-size')
    }
  }

  export const SvgSizing = {
    max_lane: 4,
    lane_width: 130,
    svg_width: 520,
    bar_length: 500,
    view_port: [0, 0, 520, window.screen.height],
    taskBarHeight: screen.height - screen.availHeight
  }
  export function useSvgSizing() {
    const lane_width = inject<number>('lane_width', 130)
    const max_lane = SvgSizing.max_lane
    const svg_width = max_lane * lane_width + 2 * 50 + 12
    const bar_length = max_lane * lane_width + 12
    const view_port = [0, 0, svg_width, window.screen.height]
    return {
      lane_width,
      svg_width,
      bar_length,
      view_port,
      taskBarHeight: screen.height - screen.availHeight,
      max_lane: SvgSizing.max_lane
    }
  }

  export namespace RefreshAll {
    import nextFrame = utils.nextFrame
    export const __key = ref(0)
    export function fuck() {
      __key.value++
      nextFrame().then(() => {
        __key.value++
      })
    }
  }
}

//@ts-ignore
window.globalstats = GlobalStat
