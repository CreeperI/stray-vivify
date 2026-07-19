import { Ref, ref } from 'vue'
import { utils } from '@renderer/core/utils'

export namespace RefreshAll {
  const keys: Record<string, Ref<string>> = {}
  export function generate_key(k: string) {
    if (k in keys) {
      return keys[k]
    } else {
      keys[k] = ref("0")
      return keys[k]
    }
  }
  export function refresh(key: string) {
    if (key in keys) {
      keys[key].value = Math.random().toFixed(8)
    }
    else console.warn("unused key "+ key)
  }
  export function refreshAll() {
    for (const k of utils.keyof(keys)) {
      keys[k].value = Math.random().toFixed(8)
    }
  }
}
