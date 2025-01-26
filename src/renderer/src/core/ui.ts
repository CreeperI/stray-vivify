import { ref } from 'vue'
import {ipcRenderer} from "electron"
import { Chart } from '@renderer/core/charter'

export default {
  state: ref('startUp' as 'startUp' | 'charting'),
  path: ref<string>(),
  ask_open() {
    ipcRenderer.invoke('open-new-chart').then()
  },
  chart: undefined as Chart | undefined
}
