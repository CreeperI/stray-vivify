import settings from '@renderer/core/settings'
import Settings from '@renderer/core/settings'
import { ref } from 'vue'

const local_key = 'vs-charter'

type proj = {
  name: string
  path: string
  last_open: number
}

export default {
  projects: [] as proj[],
  proj_state: ref(0),
  save() {
    localStorage.setItem(
      local_key,
      JSON.stringify({
        proj: this.projects,
        scale: Settings.scale.value,
        meter: Settings.meter.value,
        middle: Settings.middle.value,
        lang: settings.lang.value
      })
    )
  },
  read() {
    const data = localStorage.getItem(local_key)
    if (!data) return
    const { proj, scale, meter, middle } = JSON.parse(data)
    this.projects = (proj as proj[]).toSorted((a, b) => b.last_open - a.last_open)
    Settings.scale.value = scale
    Settings.meter.value = meter
    Settings.middle.value = middle
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
