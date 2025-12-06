import { createApp, nextTick } from 'vue'
import App from './App.vue'
import '@renderer/styles.css'

import { createModal } from '@kolirt/vue-modal'
import { ShortCuts } from '@renderer/core/shortcut'
import { Invoke, load_ipc_handlers } from '@renderer/core/ipc'
import { Settings } from '@renderer/core/settings'
import { GlobalStat } from '@renderer/core/globalStat'
import { Log } from '@renderer/core/log'
import { Chart } from '@renderer/core/chart/chart'
import { FrameRate } from '@renderer/core/frame-rates'
import { modal } from '@renderer/core/modal'

const app = createApp(App).use(
  createModal({
    transitionTime: 200,
    animationType: 'slideUp',
    modalStyle: {
      padding: '2rem 1rem'
    },
    overlayStyle: {
      'background-color': 'rgba(0,0,0,.3)'
    }
  })
)

function update_per_frame() {
  FrameRate.aniFrame.start()

  Chart.current?.on_update()
  requestAnimationFrame(update_per_frame)

  FrameRate.aniFrame.end()
  FrameRate.next_tick.start()

  nextTick().then(() => {
    FrameRate.next_tick.end()
  })
}
async function main() {
  const r = await Settings.set_from_storage()
  ShortCuts.fromJson(Settings.data.value.shortcut)
  await GlobalStat.update_all_chart()
  await GlobalStat.check_dev()
  await Invoke('leave-fullscreen')

  Settings.init_interval()
  Log.handle()
  ShortCuts.handle()
  GlobalStat.MouseTracker.init()

  GlobalStat.Intervals.on(1e4, () => {
    if (Settings.editor.auto_save) Chart.current?.save()
    Chart.current?.diff.update_tick_list()
    Chart.current?.diff.update_sr()
  })
  GlobalStat.Intervals.on(1000, () => {
    FrameRate.refresh()
    Chart.current?.playfield?.refresh()
    Chart.current?.diff.update_diff_counts()
    GlobalStat.MemoryUsage.update()

    GlobalStat.refs.window.height.value = window.innerHeight
    GlobalStat.refs.window.width.value = window.innerWidth
    window.electron.ipcRenderer.invoke('window-max-state').then((r) => {
      GlobalStat.window_max_state.value = r
    })
  })

  requestAnimationFrame(update_per_frame)
  app.mount('#app')
  if (r) {
    if (r[0] < 0) {
      modal.ShowInformationModal.show({ msg: `已从更新的版本（版本号${r[1]}）回退至${r[2]}。` })
    }
    if (r[0] > 0) {
      modal.VersionsModal.show({})
    }
  }
}

load_ipc_handlers()
main()
GlobalStat.CheckSkin.check_skin()
