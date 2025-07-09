import { IpcHandlers } from '@preload/types'
import { notify } from '@renderer/core/notify'
import { modal } from '@renderer/core/modal'

const ipcRenderer = window.electron.ipcRenderer
export const Invoke: IpcHandlers.invoke.invoke = ipcRenderer.invoke

const Handler: IpcHandlers.send.handler = {
  'notify-normal': function (_, arg) {
    notify.normal(arg[0], arg[1])
  },
  'ask-id': async function (_, ids) {
    const id = await modal.AskIdModal.show({ all: ids }) as undefined | string
    ipcRenderer.send('return-id', id)
    if (id) return id
    else return 0
  },
}

export function load_ipc_handlers() {
  for (const key of Object.keys(Handler)) {
    ipcRenderer.on(key, Handler[key])
  }
}
