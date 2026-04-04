import { Chart } from '@renderer/core/chart/chart'
import { modal } from '@renderer/core/misc/modal'
import { Intervals } from '@renderer/core/misc/intervals'
import { notify } from '@renderer/core/misc/notify'
import { RefreshAll } from '@renderer/core/misc/refresh-all'
import { ShortCuts } from '@renderer/core/misc/shortcut'
import { Invoke } from '@renderer/core/ipc'
import { Storage } from '@renderer/core/storage'
import { FrameRate } from '@renderer/core/misc/frame-rates'
import { CheckSkin } from '@renderer/core/misc/check-skin'
import { Listener } from '@renderer/core/listener'
import { utils } from '@renderer/core/utils'
import { WordHelper } from '@renderer/core/word-helper'
import { toRaw, toValue, unref } from 'vue'

// @ts-expect-error
window.sv = {
  get chart() {
    return Chart.current
  },
  modal: modal,
  interval: Intervals,
  notify: notify,
  refresh: RefreshAll,
  shortcuts: ShortCuts,
  invoke: Invoke,
  store: Storage,
  frame: FrameRate,
  skin: CheckSkin,
  listener: Listener,
  utils: utils,
  wordhelper: WordHelper,
  wh: WordHelper,
  fns: {
    toRaw: toRaw,
    toValue: toValue,
    unref: unref
  }
}

export function expose_variables() {}
