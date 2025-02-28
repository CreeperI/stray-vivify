import { createApp } from 'vue'
import App from './App.vue'
import { notify } from '@renderer/core/notify'
import ui from '@renderer/core/ui'
import { EventHub } from '@renderer/core/eventHub'
import Storage from '@renderer/core/storage'

import { createModal } from '@kolirt/vue-modal'
import { ShortCuts } from '@renderer/core/shortcut'

Storage.read()
ui.ipcRenderer.on('notify', (_, msg, duration, t) => {
  if (!t) t = 'normal'
  if (t in notify) {
    notify[t as keyof typeof notify](msg, duration)
  } else {
    notify.normal(msg, duration)
  }
})

document.addEventListener('keydown', ShortCuts.handle)

EventHub.on('update', () => {
  if (ui.chart) {
    ui.chart.on_update()
  }
  ui.windowHeight.value = window.innerHeight
  ui.windowWidth.value = window.innerWidth
})

setInterval(() => {
  if (ui.chart) {
    ui.chart.save()
  }
  Storage.save()
}, 5000)
setInterval(() => {
  EventHub.emit('update')
}, 10)

createApp(App)
  .use(
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
  .mount('#app')
