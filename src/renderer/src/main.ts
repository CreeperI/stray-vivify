import { createApp } from 'vue'
import App from './App.vue'
import '@renderer/styles.css'
import { notify } from '@renderer/core/notify'
import Storage from '@renderer/core/storage'

import { createModal } from '@kolirt/vue-modal'
import { ShortCuts } from '@renderer/core/shortcut'
import { Charter } from '@renderer/core/charter'

Storage.read()
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
  Storage.save()
}, 5000)
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

function update_per_frame() {
  Charter.refs.window.height.value = window.innerHeight
  Charter.refs.window.width.value = window.innerWidth

  Charter.if_current()?.on_update()
  requestAnimationFrame(update_per_frame)
}

requestAnimationFrame(update_per_frame)
