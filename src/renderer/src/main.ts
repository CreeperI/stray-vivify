import { createApp, nextTick } from 'vue'
import App from './App.vue'
import '@renderer/styles.css'

import { createModal } from '@kolirt/vue-modal'
import { ShortCuts } from '@renderer/core/misc/shortcut'
import { Invoke, load_ipc_handlers } from '@renderer/core/ipc'
import { Storage } from '@renderer/core/storage'
import { GlobalStat } from '@renderer/core/globalStat'
import { Log } from '@renderer/core/log'
import { Chart } from '@renderer/core/chart/chart'
import { FrameRate } from '@renderer/core/misc/frame-rates'
import { modal } from '@renderer/core/misc/modal'
import { Intervals } from '@renderer/core/misc/intervals'
import { CheckSkin } from '@renderer/core/misc/check-skin'

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
  const r = await Storage.set_from_storage()
  ShortCuts.fromJson(Storage.data.value.shortcut)
  await GlobalStat.update_all_chart()
  await GlobalStat.check_dev()
  await Invoke('leave-fullscreen')

  Storage.init_interval()
  Log.handle()
  ShortCuts.handle()
  GlobalStat.MouseTracker.init()

  Intervals.on(1e4, () => {
    if (Storage.settings.auto_save) Chart.current?.save()
    Chart.current?.diff.update_tick_list()
  })
  Intervals.on(1000, () => {
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
CheckSkin.check_skin()
