import { storages } from '@preload/types'
import { computed, ref, Ref, toRaw, watch } from 'vue'
import { utils } from '@renderer/core/utils'
import Translations, { LanguageData } from '@renderer/core/translations'
import { Charter } from '@renderer/core/charter'

const note = {
  width: ref(1),
  s: ref(false),
  b: ref(false),
  hold: ref(false),
  set_width(v: number) {
    if (v != 1) this.hold.value = false
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
  },
  set_hold(v: boolean) {
    this.hold.value = v
    this.s.value = false
    this.b.value = false
    this.set_width(1)
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

const settings: Ref<storages.storage_scheme> = ref({
  settings: {
    scale: 10,
    lang: 'zh_cn',
    meter: 4,
    middle: false,
    overlap_minimum: 0,
    reverse_scroll: false,
    volume: 100,
    lane_width: 130,
    language: 'zh_cn'
  },
  version: 6,
  shortcut: ''
})
watch(
  () => settings.value.settings.language,
  (v) => {
    utils.assign(Translations, LanguageData['zh_cn'])
    utils.assign(Translations, LanguageData[v])
  }
)
const computes = {
  mul: computed(() => (settings.value.settings.scale * 200 + 100) / 1000),
  visible: computed(() => Math.round(Charter.refs.window.height.value / computes.mul.value))
}

export const Settings = {
  data: settings,
  get editor(): storages.storage_scheme['settings'] {
    return settings.value.settings
  },
  async set_from_storage() {
    const data = await Charter.invoke('get-conf')
    if (!data) return
    const parsed = JSON.parse(data) as storages.storage_scheme
    utils.assign(this.data.value, parsed)
  },
  save() {
    Charter.invoke('save-conf', JSON.stringify(toRaw(this.data.value))).then(() => {
      console.log('settings, saved.')
    })
  },
  get version() {
    return settings.value.version
  },
  init_invertal() {
    setInterval(() => {Settings.save()}, 10000)
  },
  computes: computes,
  note: note
}

// @ts-ignore
window.settings = Settings
