import { createApp, nextTick } from 'vue'
import App from './App.vue'
import '@renderer/styles.css'

import { createModal } from '@kolirt/vue-modal'
import { ShortCuts } from '@renderer/core/shortcut'
import { Charter } from '@renderer/core/charter'
import { Invoke, load_ipc_handlers } from '@renderer/core/ipc'
import { Settings } from '@renderer/core/settings'
import { GlobalStat } from '@renderer/core/globalStat'
import { Listener } from '@renderer/core/listener'
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
  Charter.if_current()?.on_update()
  requestAnimationFrame(update_per_frame)
  FrameRate.aniFrame.end()
  FrameRate.next_tick.start()
  nextTick().then(() => {
    FrameRate.next_tick.end()
  })
}

Charter.ipcRenderer.on('window-resize', (_) => {
  Listener.trigger('resize')
})

document.addEventListener('resize', () => {
  Listener.trigger('resize')
})
Listener.on('resize', () => {
  Charter.refs.window.height.value = window.innerHeight
  Charter.refs.window.width.value = window.innerWidth
  window.electron.ipcRenderer.invoke('window-max-state').then((r) => {
    Charter.refs.window.isMaximized.value = r
  })
})

async function main() {
  const r = await Settings.set_from_storage()
  ShortCuts.fromJson(Settings.data.value.shortcut)
  await GlobalStat.update_all_chart()
  await Invoke('leave-fullscreen')

  Settings.init_invertal()
  Log.handle()
  ShortCuts.handle()
  GlobalStat.MouseTracker.init()

  setInterval(() => {
    Chart.current?.save()
  }, 10000)
  setInterval(() => {
    FrameRate.refresh()
    Chart.current?.playfield?.refresh()
    Chart.current?.diff.update_diff_counts()
  }, 1000)

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
