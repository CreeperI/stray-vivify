<script lang="ts" setup>
import { Storage } from '@renderer/core/storage'
import { h, ref, useAttrs, VNode } from 'vue'
import { Chart } from '@renderer/core/chart/chart'
import { ChartTypeV2 } from '@preload/chart-types'

const { mod, x = 0 } = defineProps<{
  mod: ChartTypeV2.mod
  x: number
}>()
const window_height = window.screen.height
const chart = Chart.$current
const vsm = chart.vsm
const mul = Storage.computes.mul
const current = chart.audio.refs.current_ms
const IS_PENDING = 'pending' in useAttrs()

const hovered = ref(false)

function V() {
  const baseX = vsm.proxy_left(mod.proxy) + x
  if (mod.repeat) {
    /*
    when mods with duration > step
    more than 1 will occur on the same time within the mod,
    and this refers to max repeat times on a certain timestamp.
    Used for aligning
     */
    const x_repeat_times = Math.min(mod.repeat, Math.ceil(mod.duration / mod.step))
    const single_height = mod.duration * mul.value

    const children: VNode[] = []
    const __bg_height = (mod.repeat * mod.step - mod.step + mod.duration) * mul.value
    const y =
      window_height -
      80 -
      (mod.time - current.value) * mul.value -
      __bg_height -
      43 +
      Storage.settings.sprites.bar_length / 2

    children.push(
      h('rect', {
        class: ['rect-repeat-bg'],
        width: hovered.value || IS_PENDING ? 10 * x_repeat_times + 4 : 14,
        x: baseX,
        y:
          window_height -
          80 -
          (mod.time - current.value) * mul.value -
          __bg_height -
          43 / 2 +
          Storage.settings.sprites.bar_length / 2,
        height: __bg_height,
        fill: IS_PENDING
          ? Storage.settings.sv.color_pending_repeat
          : Storage.settings.sv.color_repeat_bg
      })
    )

    for (let i = 0; i < mod.repeat; i++) {
      const dx = i % x_repeat_times
      const start = mod.time + i * mod.step
      children.push(
        h('rect', {
          class: ['rect-repeat'],
          width: '6',
          height: single_height,
          x: baseX + 4,
          style: {
            transform: hovered.value || IS_PENDING ? `translateX(${dx * 10}px)` : ''
          },
          y:
            window_height -
            80 -
            (start - current.value) * mul.value -
            single_height -
            43 / 2 +
            Storage.settings.sprites.bar_length / 2,
          fill: Storage.settings.sv.color_repeat_fg
        })
      )
    }
    children.push(
      h(
        'text',
        {
          x: baseX,
          y: y + __bg_height,
          'text-anchor': 'end',
          style: {
            'transform-origin': `${baseX + 2}px ${y + __bg_height}px`,
            rotate: '90deg'
          },
          fill: Storage.settings.sv.color_text
        },
        mod.modname
      )
    )
    return h(
      'g',
      {
        onMouseenterCapture: () => {
          hovered.value = true
        },
        onMouseleaveCapture: () => {
          hovered.value = false
        }
      },
      children
    )
  }
  // -------------- not repeat ----------------------
  const height = mod.duration * mul.value
  const y =
    window_height -
    80 -
    (mod.time - current.value) * mul.value -
    height -
    43 / 2 +
    Storage.settings.sprites.bar_length / 2
  return h('g', [
    h('rect', {
      class: ['rect-alone'],
      width: 15,
      height: height,
      x: baseX,
      y: y,
      style: {
        fill: IS_PENDING
          ? Storage.settings.sv.color_pending_single
          : Storage.settings.sv.color_single
      }
    }),
    h(
      'text',
      {
        x: baseX,
        y: y + height,
        'text-anchor': 'end',
        style: {
          'transform-origin': `${baseX + 2}px ${y + height}px`,
          rotate: '90deg'
        },
        fill: Storage.settings.sv.color_text
      },
      mod.modname
    )
  ])
}
</script>

<template>
  <component :is="V()" />
</template>

<style scoped>
.rect-repeat {
  pointer-events: none;
  transition: transform 100ms linear;
}

.rect-repeat-bg {
  opacity: 0.6;
  will-change: width;
  transition: width 100ms linear;
}
.rect-alone {
  pointer-events: all;
}

text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}
g {
  cursor: pointer;
}
</style>
