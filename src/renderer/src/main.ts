import { createApp } from 'vue'
import App from './App.vue'
import { notify } from '@renderer/core/notify'
import ipcRenderer = Electron.ipcRenderer

createApp(App).mount('#app')
ipcRenderer.on('notify', (_, msg, duration, t) => {
  if (!t) t = 'normal'
  if (t in notify) {
    notify[t as keyof typeof notify](msg, duration)
  } else {
    notify.normal(msg, duration)
  }
})
