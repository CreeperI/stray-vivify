import { reactive, Ref, ref, watch } from 'vue'
import { charts_data } from '@preload/types'
import { Invoke } from '@renderer/core/ipc'
import { Settings } from '@renderer/core/settings'
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
  export const window = {
    height: screen.availHeight,
    width: screen.availWidth
  }
  export const refs = {
    chart_tab: ref(2),
    header_display: ref('')
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
        () => Settings.data.value.settings.mouse_tracker,
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
        try{
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
}

//@ts-ignore
window.globalstats = GlobalStat
