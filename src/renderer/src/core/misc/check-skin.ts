import { reactive } from 'vue'
import { modal } from '@renderer/core/misc/modal'
import { utils } from '@renderer/core/utils'

export namespace CheckSkin {
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
    for (const key of utils.keyof(status)) {
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
