<script lang="ts" setup>
import { Chart, event_time } from '@renderer/core/chart/chart'
import { computed, ComputedRef, onMounted, onUnmounted, ref, toRaw } from 'vue'
import { Storage } from '@renderer/core/storage'
import Mod from '@renderer/components/chart-v2/mod.vue'
import { notify } from '@renderer/core/misc/notify'
import { PROXY_REQUIREMENT } from '@renderer/core/chart/vsm-objects'
import { ChartTypeV2 } from '@preload/chart-types'

const chart = Chart.$current
const vsm = chart.vsm
const { shown, editor, proxy_widths, proxy: viewing_proxy, all_proxy, mod_index } = vsm.refs
const mul = Storage.computes.mul
const current_time = chart.audio.refs.current_ms

const pending_modname = vsm.refs.mod
const pending_time = ref(0)
const pending_len = ref(0)
const pending_display = ref(false)
const pending_step = ref(0)
let pending_fixed = ref(false)
let pending_start_time = 0
let pending_dorepeat = false
const pending_req = computed(() => PROXY_REQUIREMENT(pending_modname.value))
const pending: ComputedRef<ChartTypeV2.mod> = computed(() => {
  return {
    time: pending_time.value,
    duration: pending_len.value || 5,
    easing: 'linear',
    modname: pending_modname.value,
    proxy: editor.value.proxy,
    step: editor.value.do_repeat ? pending_step.value : 0,
    value1: 0,
    value2: 0,
    repeat: editor.value.do_repeat ? (pending_dorepeat ? 2 : 1) : 0
  }
})

function mouseleave() {
  if (pending_fixed.value) return
  pending_display.value = false
  cleanUp()
}
function mouseenter() {
  pending_display.value = true
}
function modenter() {
  if (pending_fixed.value) return
  pending_display.value = false
}
function modleave() {
  if (pending_fixed.value) return
  pending_display.value = true
}

function update_pending(e: MouseEvent) {
  const mouse_time = event_time(e, chart, mul.value, current_time.value)
  if (pending_fixed.value) {
    if (pending_dorepeat) {
      pending_step.value = Math.max(0, mouse_time - pending_start_time)
      // here for step, since it won't be neg, needless to Math.abs for it
      return
    }
    // the start has shitted
    pending_len.value = Math.abs(mouse_time - pending_start_time)
    // reversing
    if (mouse_time <= pending_start_time) {
      pending_time.value = pending_start_time - pending_len.value
    }
    return
  }
  pending_time.value = mouse_time
}
function cleanUp() {
  pending_start_time = 0
  pending_fixed.value = false
  pending_len.value = 0
  pending_dorepeat = false
  pending_step.value = 0
}

function onclick() {
  if (pending_fixed.value) {
    if (editor.value.do_repeat) {
      if (pending_dorepeat) {
        // if the duration has confirmed:
        if (!vsm.add_mod(toRaw(pending.value))) notify.error('添加失败……')
        cleanUp()
      } else {
        // fuck the duration
        pending_dorepeat = true
      }
      return
    }
    // finished adding
    if (!vsm.add_mod(toRaw(pending.value))) notify.error('添加失败……')
    cleanUp()
  } else {
    // started
    const req = pending_req.value
    if (req != 1 && editor.value.proxy != req) {
      notify.error(`${pending_modname.value}限制了Proxy为${req}！`)
      return
    }
    pending_fixed.value = true
    pending_start_time = pending_time.value
  }
}
function onRight() {
  if (pending_fixed.value) cleanUp()
}

function del_mod(v: number) {
  vsm.del_mod(v)
}

onMounted(() => {
  vsm.enabled = true
  vsm.fuck_shown(chart.audio.current_time, true)
})
onUnmounted(() => {
  vsm.enabled = false
})
const _line_width = computed(() => Storage.settings.sv.pending_width)
const _line_stroke = computed(() => Storage.settings.sv.pending_stroke)
const _line_opacity = computed(() => Storage.settings.sv.pending_opacity)
const _line_y = computed(() => {
  return 1000 - (pending_time.value - current_time.value) * mul.value - 43 / 2 + _line_width.value
})

function chg_proxy(p: number) {
  if (pending_req.value != 1) {
    editor.value.proxy = pending_req.value
    return
  }
  editor.value.proxy = p
}

const _rect_left = (_proxy: number) => {
  return vsm.proxy_left(_proxy)
}

const shown_proxy_rect = computed(() => {
  return {
    ix: viewing_proxy.value,
    width: proxy_widths.value[viewing_proxy.value + 1] ?? 40,
    left: 56
  }
})
</script>

<template>
  <g
    id="svg-mods-editor"
    @click="onclick"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
    @mousemove="update_pending"
    @click.right="onRight"
  >
    <rect
      id="mods-eventer"
      height="100%"
      opacity="0"
      width="100%"
      x="0"
      y="0"
      @mouseenter="mouseenter"
    />
    <template v-if="all_proxy">
      <template v-for="(val, ix) in proxy_widths">
        <rect
          :width="val"
          :x="_rect_left(ix - 1)"
          fill="#ccc"
          height="1000"
          opacity="0.2"
          y="0"
          @mouseenter="chg_proxy(ix - 1)"
        />
        <Teleport defer to="#svg-overflow">
          <text :x="_rect_left(ix - 1) + val / 2" text-anchor="middle" y="1020" v-text="ix - 1" />
        </Teleport>
      </template>
    </template>
    <template v-else>
      <rect
        :width="shown_proxy_rect.width"
        :x="shown_proxy_rect.left"
        fill="#ccc"
        height="1000"
        opacity="0.2"
        y="0"
        @mouseenter="chg_proxy(shown_proxy_rect.ix)"
      />
      <teleport defer to="#svg-overflow">
        <text
          :x="shown_proxy_rect.left + shown_proxy_rect.width / 2"
          text-anchor="middle"
          y="1020"
          v-text="viewing_proxy"
        />
      </teleport>
    </template>

    <mod
      v-for="[ix, x] in shown"
      :key="ix"
      :mod="vsm.vsm.mods[ix]"
      :x="x"
      @contextmenu="del_mod(ix)"
      @mouseenter="modenter"
      @mouseleave="modleave"
      @click.capture.stop="mod_index = ix"
    />
    <mod v-if="pending_display && pending_fixed" :mod="pending" :x="0" pending />
    <line
      v-if="!pending_fixed && pending_display"
      :stroke="_line_stroke"
      :stroke-opacity="_line_opacity"
      :stroke-width="_line_width"
      :x1="_rect_left(editor.proxy)"
      :x2="_rect_left(editor.proxy) + proxy_widths[editor.proxy + 1]"
      :y1="_line_y"
      :y2="_line_y"
      style="pointer-events: none"
    />
  </g>
</template>

<style scoped></style>
