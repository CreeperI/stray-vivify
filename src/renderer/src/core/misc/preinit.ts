import { reactive, ref } from 'vue'

export namespace Preinit {
  export const Initialized = ref(false)
  export function finish_init() {
    Initialized.value = true
  }

  export const Stages = reactive({
    load_settings: false,
    all_chart: false,
    debugs: false,
    intervals: false,
    animation_frame: false
  })
}
