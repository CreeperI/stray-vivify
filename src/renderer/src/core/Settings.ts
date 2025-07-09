import { storages } from '@preload/types'
import { ref, Ref, watch } from 'vue'
import { utils } from '@renderer/core/utils'
import Translations, { LanguageData } from '@renderer/core/translations'
import { Charter } from '@renderer/core/charter'

const settings: Ref<storages.settings> = ref({
  scale: 10,
  lang: 'zh_cn',
  meter: 4,
  middle: false,
  note_type: '',
  overlap_minimum: 0,
  reverse_scroll: false,
  volume: 100,
  lane_width: 210,
  language: "zh_cn"
})
watch(
  () => settings.value.language,
  (v) => {
    utils.assign(Translations, LanguageData['zh_cn'])
    utils.assign(Translations, LanguageData[v])
  }
)

export const Settings = {
  data: settings,
  get value(): storages.storage_scheme['settings'] {
    return settings.value
  },
  async set_from_storage() {
    const data = await Charter.invoke('get-settings-data')
    utils.assign(this.data.value, data)
  },
  save() {
    Charter.invoke('set-storage', )
  }
}
