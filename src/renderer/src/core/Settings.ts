import { ChartTypeV2, storages } from '@preload/types'
import { computed, ref, Ref, toRaw, watch } from 'vue'
import { utils } from '@renderer/core/utils'
import Translations, { LanguageData } from '@renderer/core/translations'
import { Charter } from '@renderer/core/charter'

const settings: Ref<storages.storage_scheme> = ref({
  settings: {
    scale: 10,
    lang: 'zh_cn',
    meter: 4,
    middle: false,
    note_type: '',
    overlap_minimum: 0,
    reverse_scroll: false,
    volume: 100,
    lane_width: 130,
    language: 'zh_cn'
  },
  version: 6,
  shortcut: ""
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
      console.log("settings, saved.")
    })
  },
  get version() {
    return settings.value.version
  },
  note_choice(n: ChartTypeV2.note['n']) {
    if (settings.value.settings.note_type == n) {
      settings.value.settings.note_type = ''
    } else settings.value.settings.note_type = n
  },
  computes: computes
}

// @ts-ignore
window.settings = Settings
