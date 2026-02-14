import { Chart } from '@renderer/core/chart/chart'
import { computed, ComputedRef, ref, Ref, triggerRef, watch } from 'vue'
import { utils } from '@renderer/core/utils'
import { PROXY_REQUIREMENT, VSM_EASING, VSM_MODS } from '@renderer/core/chart/vsm-objects'
import { Storage } from '@renderer/core/storage'
import { FrameRate } from '@renderer/core/misc/frame-rates'
import { notify } from '@renderer/core/misc/notify'
import { ChartTypeV2 } from '@preload/chart-types'

const getEffectiveEnd = (mod: ChartTypeV2.mod) => {
  return mod.time + mod.step * (mod.repeat - 1) + mod.duration
}
function fix_mod(m: ChartTypeV2.mod) {
  m.time = Math.max(0, m.time)
  if (!m.repeat) {
    m.step = 0
  } else if (m.step == 0) {
    m.repeat = 0
  }
  if (!VSM_EASING.includes(m.easing)) m.easing = 'linear'
  const req = PROXY_REQUIREMENT(m.modname)
  if (req != 1) m.proxy = req
}
export class Chart_vsm {
  chart: Chart
  data: ChartTypeV2.vsm[]
  refs: {
    obj: Ref<{
      obj: string
      proxies: number
      name: string
    }>
    vsm_index: Ref<number>
    able_mods: ComputedRef<({ name: string; proxy?: 0 | -1 } | string)[]>
    mod: Ref<string>
    mod_index: Ref<number>
    // index, translateX
    shown: Ref<[number, number][]>
    editor: Ref<{
      repeat: number
      duration: number
      step: number
      do_repeat: boolean
      easing: string
      // the proxy of new mod
      proxy: number
    }>
    all_proxy: Ref<boolean>
    // another one from editor.proxy, this is *which proxy you are viewing*
    proxy: Ref<number>
    proxy_widths: Ref<number[]>
    sorted_able_mods: ComputedRef<string[]>
  }
  enabled: boolean
  last_update: number

  constructor(chart: Chart) {
    this.chart = chart
    this._vsm_index = 0
    this.data = [Chart_vsm.create_vsm()]
    this.enabled = false
    this.last_update = 0

    const x = this
    this.refs = {
      obj: ref({
        obj: 'obj_base_gimmick',
        proxies: 0,
        name: 'vsm-0'
      }),
      vsm_index: ref(0),
      able_mods: computed(() => {
        const r = VSM_MODS['obj_base_gimmick'].slice()
        if (x.refs.obj.value.obj != 'obj_base_gimmick') {
          return r.concat(VSM_MODS[x.refs.obj.value.obj])
        } else return r
      }),
      mod: ref('scrollspeed'),
      mod_index: ref(-1),
      shown: ref([]),
      editor: ref({
        repeat: 0,
        duration: 0,
        step: 0,
        do_repeat: false,
        easing: 'linear',
        proxy: -1
      }),
      proxy: ref(-1),
      proxy_widths: ref([40]),
      all_proxy: ref(true),
      sorted_able_mods: computed(() => {
        if (Storage.settings.sv.sort_by_name)
          return x.refs.able_mods.value.map((a) => (typeof a == 'string' ? a : a.name)).toSorted()
        return x.refs.able_mods.value.map((a) => (typeof a == 'string' ? a : a.name))
      })
    }

    watch(this.refs.vsm_index, (v) => {
      this._vsm_index = v
      this.refs.mod_index.value = -1
      utils.less_assign(this.refs.obj.value, this.data[v])
      this.fuck_shown(this.chart.audio.current_time, true)
    })

    watch(
      this.refs.obj,
      (v) => {
        utils.less_assign(this.vsm, v)
        utils.refresh()
        this.refs.proxy_widths.value = this.refs.proxy_widths.value.slice(0, v.proxies + 2)
      },
      { deep: true }
    )

    watch(this.refs.proxy, () => {
      this.force_fuck()
    })
    watch(this.refs.all_proxy, () => {
      this.force_fuck()
    })
  }

  get vsm() {
    return this.data[this._vsm_index]
  }

  _vsm_index: number

  get vsm_index() {
    return this._vsm_index
  }

  set vsm_index(v: number) {
    this._vsm_index = v
    this.refs.mod_index.value = -1
    this.refs.vsm_index.value = v
  }

  static create_vsm(): ChartTypeV2.vsm {
    return {
      obj: 'obj_base_gimmick',
      mods: [],
      mpfs: [],
      proxies: 0,
      name: 'vsm'
    }
  }

  static to_vsm(chart: Chart, vsm: ChartTypeV2.vsm): string[] {
    if (vsm.mods.length == 0) {
      notify.error('空的哦……')
      return []
    }
    const strs: string[] = []
    strs.push(`!proxies: ${vsm.proxies}`)
    strs.push(`!obj: ${vsm.obj}`)
    const toBeatL = (t: number, l: number) => chart.diff.get_beat_length(t, l)
    const beatOf = (t: number) => chart.diff.get_beat_info(t).beat_at
    // plus 1 for the last one
    const endbeat = (m: ChartTypeV2.mod) => m.time + (m.repeat - 1) * m.step + 1
    for (let i = 0; i < vsm.mods.length; i++) {
      const mod = vsm.mods[i]
      if (mod.repeat) {
        strs.push(
          `${beatOf(mod.time)}:${toBeatL(mod.time, endbeat(mod))}:${toBeatL(mod.time, mod.step)},${toBeatL(mod.time, mod.duration)},${mod.easing},${mod.value1 ?? '_'},${mod.value2 ?? '_'},${mod.modname},${mod.proxy}`
        )
      } else {
        strs.push(
          `${beatOf(mod.time)},${toBeatL(mod.time, mod.duration)},${mod.easing},${mod.value1 ?? '_'},${mod.value2 ?? '_'},${mod.modname},${mod.proxy}`
        )
      }
    }
    return strs
  }

  new_vsm() {
    this.add_vsm(Chart_vsm.create_vsm())
  }
  add_vsm(v: ChartTypeV2.vsm) {
    this.data.push(v)
    this.vsm_index = this.data.length - 1
  }

  del_vsm() {
    if (this.data.length == 1) {
      this.data[0] = Chart_vsm.create_vsm()
      triggerRef(this.refs.vsm_index)
      return
    }
    this.data.splice(this.vsm_index, 1)
    this.vsm_index = 0
  }

  copy_vsm() {
    const r = Chart_vsm.create_vsm()
    utils.assign(r, this.vsm)
    this.vsm_index = this.data.push(r)
  }

  set_vsm(v: ChartTypeV2.vsm) {
    utils.less_assign(this.vsm, v)
    this.refs.obj.value = {
      obj: v.obj,
      proxies: v.proxies,
      name: v.name
    }
  }

  fuck_shown(t: number, force = false) {
    if (force ? false : Math.abs(t - this.last_update) < Storage.settings.pooling.ahead) return
    FrameRate.fuck_vsm.start()

    const { mod_width, mod_gap } = Storage.settings.sv
    const visible = [
      t - Storage.settings.pooling.ahead,
      t + Storage.computes.visible.value + Storage.settings.pooling.ahead
    ] as [number, number]

    const all_proxy = this.refs.all_proxy.value

    const ixs = utils
      .indexes_of(this.vsm.mods, (mod) => {
        const effEnd = getEffectiveEnd(mod)
        return !(effEnd <= visible[0] || mod.time >= visible[1])
      })
      .filter((ix) => {
        if (all_proxy) return true
        return this.vsm.mods[ix].proxy === this.refs.proxy.value
      })

    const groups = new Map<number, number[]>()

    for (let i = -1; i <= this.refs.obj.value.proxies; i++) {
      groups.set(i, [])
    }
    for (const idx of ixs) {
      const p = this.vsm.mods[idx].proxy
      if (!groups.has(p)) groups.set(p, [])
      groups.get(p)!.push(idx)
    }

    const assigned = new Map<number, number>()

    // --- 处理 shown (x positions) ---
    for (const [_, indices] of groups) {
      const modEntries = indices.map((idx) => ({
        idx,
        start: this.vsm.mods[idx].time,
        end: getEffectiveEnd(this.vsm.mods[idx])
      }))

      modEntries.sort((a, b) => a.start - b.start)

      const columnEnds: number[] = []
      for (const entry of modEntries) {
        let col = 0
        for (; col < columnEnds.length; col++) {
          if (columnEnds[col] <= entry.start) {
            columnEnds[col] = entry.end
            break
          }
        }
        if (col === columnEnds.length) {
          columnEnds.push(entry.end)
        }
        assigned.set(entry.idx, col * (mod_width + mod_gap))
      }
    }

    this.refs.shown.value = ixs.map((idx) => [idx, assigned.get(idx)!])

    // --- 更新 proxy_widths (number[]) ---
    let widthsArray = this.refs.proxy_widths.value || []

    // 找出本次需要更新的所有 proxy
    const proxiesToUpdate = Array.from(groups.keys())

    // 确保数组足够长：最大 proxy → index = maxProxy + 1
    if (proxiesToUpdate.length > 0) {
      const maxProxy = Math.max(...proxiesToUpdate)
      const requiredLength = maxProxy + 1 + 1 // +1 for proxy=-1 offset
      if (widthsArray.length < requiredLength) {
        // 扩展数组，新位置用 40 填充（最小宽度）
        const newArray = [...widthsArray]
        while (newArray.length < requiredLength) {
          newArray.push(40)
        }
        widthsArray = newArray
      }

      // 更新每个涉及的 proxy
      for (const proxy of proxiesToUpdate) {
        const idxInArray = proxy + 1

        // 重新计算该 proxy 的列数（复用上面逻辑，或缓存？这里简单重算）
        const indices = groups.get(proxy)!
        const modEntries = indices
          .map((i) => ({
            start: this.vsm.mods[i].time,
            end: getEffectiveEnd(this.vsm.mods[i])
          }))
          .sort((a, b) => a.start - b.start)

        const columnEnds: number[] = []
        for (const entry of modEntries) {
          let col = 0
          for (; col < columnEnds.length; col++) {
            if (columnEnds[col] <= entry.start) {
              columnEnds[col] = entry.end
              break
            }
          }
          if (col === columnEnds.length) {
            columnEnds.push(entry.end)
          }
        }

        const n = columnEnds.length
        const width = n * mod_width + (n - 1) * mod_gap
        widthsArray[idxInArray] = Math.max(40, width)
      }

      this.refs.proxy_widths.value = widthsArray
    }

    this.last_update = t
  }

  update() {
    if (this.enabled) this.fuck_shown(this.chart.audio.current_time)
  }

  add_mod(v: ChartTypeV2.mod) {
    fix_mod(v)
    const tm = this.vsm.mods.find(
      (x) => x.time == v.time && x.modname == v.modname && v.proxy == x.proxy
    )
    if (tm) return false

    const pos = this.binarySearchTimePosition(v.time)
    this.vsm.mods.splice(pos, 0, v)
    this.refs.mod_index.value = pos
    this.force_fuck()
    return true
  }

  del_mod(v: number | ChartTypeV2.mod) {
    if (typeof v == 'number') {
      if (v < 0) return
      this.vsm.mods.splice(v, 1)
      this.force_fuck()
      if (this.refs.mod_index.value > this.vsm.mods.length - 1) this.refs.mod_index.value = -1
      return true
    } else {
      const ix = this.vsm.mods.indexOf(v)
      if (ix > -1) {
        notify.error('删除mod失败！')
        return false
      }
      this.vsm.mods.splice(ix, 1)
      this.refs.shown.value = this.refs.shown.value
      if (this.refs.mod_index.value > this.vsm.mods.length - 1) this.refs.mod_index.value = -1
      return true
    }
  }

  proxy_left(proxy: number) {
    if (!this.refs.all_proxy.value) return 56
    if (proxy == -1) return 56
    return (
      56 +
      this.refs.proxy_widths.value.slice(0, proxy + 1).reduce((a, b) => a + b, 0) +
      (proxy + 1) * Storage.settings.sv.proxy_gap
    )
  }

  enable_repeat() {
    this.refs.editor.value.do_repeat = true
  }

  disable_repeat() {
    this.refs.editor.value.do_repeat = false
  }

  private force_fuck() {
    this.fuck_shown(this.chart.audio.current_time, true)
  }

  private binarySearchTimePosition(time: number): number {
    let start = 0
    let end = this.vsm.mods.length - 1

    while (start <= end) {
      const mid = Math.floor((start + end) / 2)
      if (this.vsm.mods[mid].time === time) {
        return mid
      } else if (this.vsm.mods[mid].time < time) {
        start = mid + 1
      } else {
        end = mid - 1
      }
    }

    return start
  }
}
