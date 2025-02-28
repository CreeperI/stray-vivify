import { ref, toRaw } from 'vue'
import { ShortCuts } from '@renderer/core/shortcut'
import { Charter } from '@renderer/core/charter'

const local_key = 'vs-charter'

type proj = {
  name: string
  path: string
  last_open: number
}

function or<T, K>(val: T, other: K) {
  if (val === undefined) return other
  return val
}

export default {
  projects: [] as proj[],
  proj_state: ref(0),
  save() {
    localStorage.setItem(
      local_key,
      JSON.stringify({
        proj: this.projects,
        shortcuts: ShortCuts.toJson(),
        ...toRaw(Charter.settings)
      })
    )
  },
  read() {
    const s = localStorage.getItem(local_key)
    if (!s) return
    const data = JSON.parse(s)
    this.projects = or(data.proj, []).toSorted((a, b) => b.last_open - a.last_open)
    const settings = Charter.settings
    settings.scale(data.scale)
    settings.meter(data.meter)
    settings.middle(data.middle)
    settings.note_type(data.note_type)
    settings.overlap_minimum(data.overlap_minimum)
    settings.reverse_scroll(data.reverse_scroll)
  },
  add_proj(p: string, n: string) {
    const existed = this.projects.find((x) => x.path == p)
    if (existed) {
      existed.name = n
      return
    }
    this.projects.push({
      name: n,
      path: p,
      last_open: Date.now()
    })
    this.update_state()
  },
  remove_proj(p: string) {
    this.projects = this.projects.filter((x) => x.path != p)
    this.update_state()
  },
  update_state() {
    this.proj_state.value = this.projects
      .map((pj) => pj.path + pj.name)
      .reduce((a, b) => a + b).length
  }
}
