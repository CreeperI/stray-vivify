import { storages } from '@preload/types'
import { computed, ref, toRaw, watch } from 'vue'
import { utils } from '@renderer/core/utils'
import { Invoke } from '@renderer/core/ipc'
import { GlobalStat } from '@renderer/core/globalStat'

export const Version = {
  val: 9.7,
  str: '0.9.7'
}

const note = {
  width: ref(1),
  s: ref(false),
  b: ref(false),
  hold: ref(false),
  set_width(v: number) {
    if (v == 1) this.s.value = false
    if (v == this.w) this.width.value = 0
    else this.width.value = v
  },
  set_s(v: boolean) {
    this.s.value = v
    this.b.value = false
  },
  set_b(v: boolean) {
    this.b.value = v
    this.s.value = false
    this.hold.value = false
  },
  set_hold(v: boolean) {
    this.hold.value = v
    this.b.value = false
  },
  get w() {
    return this.width.value
  },
  get h() {
    return this.hold.value
  },
  get snm() {
    if (this.s.value) return 2
    else if (this.b.value) return 1
    else return 0
  },
  change_b() {
    this.set_b(!this.b.value)
  },
  change_s() {
    this.set_s(!this.s.value)
  },
  change_hold() {
    this.set_hold(!this.hold.value)
  }
}

const storage = ref<storages.storage_scheme>({
  settings: {
    scale: 10,
    meter: 4,
    reverse_scroll: false,
    lane_width: 130,
    show_bottom_timing: true,
    show_bpm_bottom: true,
    show_ticks: true,
    offset1: 0,
    offset2: 0,
    offset3: 0,
    record_field: {
      show_bar_text: true,
      show_beat_line: true,
      show_bpm_bottom: true,
      show_bpm_left: true,
      detail: 3,
      sprite: true,
      show_ticks: true,
      show_circles: false
    },
    sprites: {
      bar_color1: '#ffffff',
      bar_color2: '#7afbff',
      bar_color3: '#8bff66',
      bar_color4: '#4a5dff',
      bar_color5: '#f64eff',
      bar_color6: '#fff04e',
      bar_color7: '#4eeaff',
      bar_length: 6,
      bar_op: 0,
      bar_dy: 0
    },
    delete_no_confirm: false,
    time_max_length: 50,
    judgement: {
      p1: 25,
      p2: 60,
      p3: 120,
      p4: 200,
      p5: 60
    },
    density_data_count: 100,
    mouse_tracker: false,
    debug_window: false,
    frame_time: true,
    hit_sound: true,
    svg_shown_parts: {
      sprite: true,
      song: true,
      diff: true,
      sv: true,
      timing: true,
      tick: true,
      bar: true
    },
    star_rating: false,
    color_stats: false,
    min_lane: 4,
    bar_or_section: false,
    beat_fn_time: false,
    bar_from_0: true,
    hit_volume: 100,
    pooling: {
      ahead: 5000,
      behind: 500,
      count: 200,
      interval: 2000
    },
    auto_save: false,
    exporter: {
      sv: false,
      crop: false
    },
    nearest: 2,
    sv: {
      sort_by_name: false,
      short_obj: false,
      lane_width: 30,
      opacity: 80,
      pending_stroke: '#ffffff',
      pending_opacity: 100,
      pending_width: 4,
      expand_width: 200,
      mod_gap: 10,
      mod_width: 20,
      repeat_gap: 8,
      proxy_gap: 20,
      color_single: '#1a73e8',
      color_repeat_bg: '#ffd700',
      color_repeat_fg: '#008000',
      color_pending_single: '#88aa55',
      color_pending_repeat: "#ffc0cb",
      color_text: "#b8dcee"
    },
    always_version: true,
    stray_logo: true,
    err_notify: true,
    diff_reference: {
      main_lw: 130,
      ref_lw: 80,
      reverse: false,
      as_bg: false,
      bg_op: 70
    }
  },
  version: Version.val,
  shortcut: '',
  username: 'newcomer',
  statistics: {
    used_time: 0,
    first_open: Date.now()
  }
})

watch(storage, () => {}, { deep: true })
const computes = {
  mul: computed(() => (storage.value.settings.scale * 200 + 100) / 1000),
  visible: computed(() => Math.round(GlobalStat.refs.window.height.value / computes.mul.value)),
  mul_sec: computed(() => storage.value.settings.scale * 200 + 100)
}

function merge(s: storages.storage_scheme) {
  if (s.version) {
    if (s.version < 9.5) s.settings.auto_save = true
  }
}

export const Storage = {
  data: storage,
  _ref: storage,
  get settings(): storages.storage_scheme['settings'] {
    return storage.value.settings
  },
  /**
   * @returns undefined|number positive if switching from future versions,
   *          0 -> no change, neg -> updated!
   */
  async set_from_storage() {
    const data = await Invoke('get-conf')
    if (!data) return
    const parsed = JSON.parse(data) as storages.storage_scheme
    merge(parsed)
    utils.less_assign(this.data.value, parsed)
    const d = [Version.val - parsed.version, parsed.version, Version.val]
    this.data.value.version = Version.val
    this.update_join_time()
    return d
  },
  async update_join_time() {
    const time = await Invoke('joined-time')
    this.data.value.statistics.first_open = Math.min(time, this.data.value.statistics.first_open)
  },
  save() {
    Invoke('save-conf', {data:JSON.stringify(toRaw(this.data.value))})
  },
  get version() {
    return storage.value.version
  },
  init_interval() {
    setInterval(() => {
      Storage.save()
    }, 10000)
  },
  computes: computes,
  note: note,

  __start_time: Date.now(),
  __update_last: Date.now(),
  running_time: ref(0),
  update_used_time() {
    storage.value.statistics.used_time += Date.now() - this.__update_last
    this.__update_last = Date.now()
    this.running_time.value = Date.now() - this.__start_time
  }
}
