// @ts-nocheck
import ElectronStore, { Schema } from 'electron-store'
import { storages } from '../preload/types'

const schema: Schema<storages.storage_scheme> = {
  settings: {
    type: 'object',
    default: {
      scale: 1,
      lang: 'zh_cn',
      meter: 4,
      middle: false,
      note_type: '',
      overlap_minimum: 0,
      reverse_scroll: false,
      volume: 100,
      lane_width: 210
    },
    properties: {
      scale: {
        type: 'number',
        default: 1
      },
      lang: {
        type: 'string',
        default: 'zh_cn'
      },
      meter: {
        type: 'number',
        default: 4
      },
      middle: {
        type: 'boolean',
        default: false
      },
      note_type: {
        type: 'string'
      },
      overlap_minimum: {
        type: 'number',
        default: 0
      },
      reverse_scroll: {
        type: 'boolean',
        default: false
      },
      volume: {
        type: 'number',
        default: 100
      },
      lane_width: {
        type: 'number',
        default: 130
      }
    }
  },
  version: {
    type: 'number'
  },
  shortcut: {
    type: 'string'
  }
}

const store = new ElectronStore<storages.storage_scheme>({
  schema: schema
})

export const MainStorage = {
  get: function (_: Electron.IpcMainInvokeEvent): storages.storage_scheme {
    return store.store
  },
  set: function (_: Electron.IpcMainInvokeEvent, val: storages.settings) {
    store.set('settings', val)
  },
  store: store,
  get_key<T extends keyof storages.storage_scheme>(key: T) {
    return store.get(key)
  }
}

export function load_storage_handler() {
  console.log('loaded storage handler')
  migrate()
}
function migrate() {
  if (store.get('version') == undefined) {
    store.set('version', 6)
    store.delete('settings.charter_layout')
    store.delete('projects')
    store.set('settings.lane_width', 210)
  }
}
