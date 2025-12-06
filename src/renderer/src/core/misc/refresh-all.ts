import { ref } from 'vue'
import { utils } from '@renderer/core/utils'

export namespace RefreshAll {
  export const __key = ref(0)
  export function fuck() {
    __key.value++
    utils.nextFrame().then(() => {
      __key.value++
    })
  }
}
