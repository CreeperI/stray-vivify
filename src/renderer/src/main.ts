import { createApp } from 'vue'
import App from './App.vue'
import '@renderer/styles.css'
import { notify } from '@renderer/core/notify'

import { createModal } from '@kolirt/vue-modal'
import { ShortCuts } from '@renderer/core/shortcut'
import { Charter } from '@renderer/core/charter'
import { load_ipc_handlers } from '@renderer/core/ipc'
import { Settings } from '@renderer/core/Settings'
import { GlobalStat } from '@renderer/core/globalStat'
import { Listener } from '@renderer/core/listener'

Charter.ipcRenderer.on('notify', (_, msg, duration, t) => {
  if (!t) t = 'normal'
  if (t in notify) {
    notify[t as keyof typeof notify](msg, duration)
  } else {
    notify.normal(msg, duration)
  }
})

document.addEventListener('keydown', ShortCuts.handle)

setInterval(() => {
  Charter.if_current()?.save()
}, 10000)
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
  Charter.if_current()?.on_update()
  requestAnimationFrame(update_per_frame)
}

Charter.ipcRenderer.on('window-resize', (_) => {
  Listener.trigger('resize')
})

document.addEventListener('resize', () => {Listener.trigger('resize')})
Listener.on('resize', () => {
  Charter.refs.window.height.value = window.innerHeight
  Charter.refs.window.width.value = window.innerWidth
  window.electron.ipcRenderer.invoke('window-max-state').then((r) => {
    Charter.refs.window.isMaximized.value = r
  })
})

async function main() {
  await Settings.set_from_storage()
  await GlobalStat.update_all_chart()

  app.mount('#app')
  requestAnimationFrame(update_per_frame)
}

load_ipc_handlers()
main()
