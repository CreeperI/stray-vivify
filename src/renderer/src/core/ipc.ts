import { IpcHandlers } from '@preload/types'
import { notify } from '@renderer/core/misc/notify'
import { modal } from '@renderer/core/misc/modal'
import { Chart } from '@renderer/core/chart/chart'

const ipcRenderer = window.electron.ipcRenderer
export const Invoke: IpcHandlers.invoke.invoke = ipcRenderer.invoke
export const Send = ipcRenderer.send as IpcHandlers.send.send

const Handler: IpcHandlers.send.handler = {
  'notify-normal': function (_, arg) {
    notify.normal(arg.msg, arg.dur)
  },
  'ask-id': async function (_, { ids, def }) {
    const id = (await modal.AskIdModal.show({ all: ids, def: def })) as undefined | string
    ipcRenderer.send('return-id', id)
    if (id) return id
    else return 0
  },
  'notify-error': function (_, { msg, dur }) {
    notify.error(msg, dur)
  },
  'im-closing': async () => {
    if (Chart.current) await Chart.current.save()
    ipcRenderer.send('can-close')
  }
}

export function load_ipc_handlers() {
  for (const key of Object.keys(Handler)) {
    ipcRenderer.on(key, Handler[key])
  }
}
