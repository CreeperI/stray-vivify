import { reactive } from 'vue'
import { GlobalStat } from '@renderer/core/globalStat'

export namespace Preinit {
  export function finish_init() {
    GlobalStat.route.change('start')
  }

  export const Stages = reactive({
    load_settings: false,
    all_chart: false,
    debugs: false,
    intervals: false,
    animation_frame: false,
    check_skin: false
  })
}
