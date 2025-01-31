import { createApp } from 'vue'
import App from './App.vue'
import { notify } from '@renderer/core/notify'
import ui from '@renderer/core/ui'
import { EventHub } from '@renderer/core/eventHub'
import Storage from '@renderer/core/storage'

Storage.read()
createApp(App).mount('#app')
ui.ipcRenderer.on('notify', (_, msg, duration, t) => {
  if (!t) t = 'normal'
  if (t in notify) {
    notify[t as keyof typeof notify](msg, duration)
  } else {
    notify.normal(msg, duration)
  }
})

function listen(e: KeyboardEvent) {
  // check if user's inputting sth
  if (document.activeElement instanceof HTMLInputElement) return
  const chart = ui.chart
  if (e.code == 'F8') {
    debugger
  }
  if (e.code == 'Space') {
    if (!chart) return
    e.preventDefault()
    chart.audio.paused ? chart.audio.play() : chart.audio.pause()
  } else if (e.code == 'KeyS' && e.ctrlKey) {
    e.preventDefault()
    ui.chart?.save()
  } else if (e.code == 'Numpad1' || e.code == 'Digit1') {
    ui.note_choice('n')
  } else if (e.code == 'Numpad2' || e.code == 'Digit2') {
    ui.note_choice('b')
  } else if (e.code == 'Numpad3' || e.code == 'Digit3') {
    ui.note_choice('m')
  } else if (e.code == 'Numpad4' || e.code == 'Digit4') {
    ui.note_choice('mb')
  } else if (e.code == 'Numpad5' || e.code == 'Digit5') {
    ui.note_choice('h')
  } else if (e.code == 'Numpad6' || e.code == 'Digit6') {
    ui.note_choice('s')
  }
}

document.addEventListener('keydown', listen)

EventHub.on('update', () => {
  if (ui.chart) {
    ui.chart.update_current()
    ui.chart.play_rate_ref.value = ui.chart.playRate
  }
})

setInterval(() => {
  if (ui.chart) {
    ui.chart.save()
  }
  Storage.save()
}, 5000)
setInterval(() => {
  EventHub.emit('update')
}, 16)
