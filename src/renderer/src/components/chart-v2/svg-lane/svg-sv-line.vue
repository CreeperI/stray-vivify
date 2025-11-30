<script lang="ts" setup>
import { Settings } from '@renderer/core/settings'
import { computed, h, ref, VNode } from 'vue'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'
import { ChartTypeV2 } from '@preload/types'
import { factory_strings } from '@renderer/core/chart/diff-sv'

const chart = Chart.$current
const chart_sv = chart.diff.sv_bind
const mul = Settings.computes.mul
const current_time = chart.audio.refs.current_ms
const shown = chart.diff.sv_bind.shown
const sv_data = chart_sv.sv_data
const { view_port } = GlobalStat.useSvgSizing()

// ------------- Pending --------------------
const pending_time = ref(0)
const pending_display = ref(false)
const pending_end = ref(0)
const pending_fixed = ref(false)
let pending_fixed_time = 0
const text_time = computed(() => {
  return pending_fixed.value ? Math.min(pending_time.value, pending_end.value) : pending_time.value
})
const there_is = computed(() => {
  return shown.value.find((x) => {
    return Math.abs(x.time - pending_time.value) < Settings.editor.nearest
  })
})
const pending_text_dx = computed(() => {
  if (there_is.value) {
    if ('type' in there_is.value) return "0"
    return "3rem"
  }
  return "0"
})
const sv_pending = computed<ChartTypeV2.sv_all>(() => {
  if (sv_data.value.is_factory)
    return {
      type: -1,
      time: pending_time.value,
      end: pending_end.value
    }
  return {
    time: pending_time.value,
    eff: 1
  }
})

function mouseenter() {
  pending_display.value = true
}
function mouseleave() {
  pending_display.value = false
}
function nearest_in_shown(t: number) {
  return shown.value.find((x) => Math.abs(x.time - t) < Settings.editor.sv.threshold)?.time ?? t
}

function update_pending(e: MouseEvent) {
  if (GlobalStat.chart_state.value != 0) return
  if (!chart.audio.paused) return
  if (e.target instanceof HTMLImageElement) {
    return
  }
  // initially here should be -80 but considering the transform of the beat lines that sucks
  // so i just made it -100
  const bottom = GlobalStat.refs.window.height.value - e.pageY - 100

  const time = nearest_in_shown(
    chart.diff.nearest_threshold(
      bottom / mul.value + current_time.value,
      Settings.editor.sv.threshold
    )
  )
  if (pending_fixed.value) {
    // pending_end.value = time
    if (time <= pending_fixed_time) {
      pending_end.value = pending_fixed_time
      pending_time.value = time
    } else {
      pending_end.value = time
    }
  } else {
    pending_time.value = time
    pending_end.value = time + 5
  }
  pending_display.value = pending_time.value >= 0
}

function on_click() {
  if (sv_data.value.is_factory) {
    if (pending_fixed.value) {
      // then is the end of which
      const new_one = chart.diff.sv_bind.new_sv(sv_data.value.type)
      new_one.end = pending_end.value
      new_one.time = pending_time.value
      chart_sv.add_sv(new_one)
      pending_fixed.value = false
      pending_end.value = 0
      pending_time.value = 0
    } else {
      pending_fixed.value = true
      pending_fixed_time = pending_time.value
    }
  } else {
    chart_sv.add_sv({
      time: pending_time.value,
      eff: 1
    })
  }
}
function on_right() {
  if (chart_sv.remove_sv({ time: pending_time.value })) return
  pending_fixed.value = false
  pending_end.value = 0
  pending_time.value = 0
}

// -------------- Renderer -------------------
const { bar_length } = GlobalStat.useSvgSizing()
function time_bottom(t: number) {
  return view_port[3] - (t - current_time.value) * mul.value - 80 - Settings.editor.sprites.bar_dy
}
function sv_single(x: ChartTypeV2.sv_all): VNode[] {
  if ('type' in x) {
    const y = time_bottom(x.time)
    const height = time_bottom(x.end) - y
    return [
      h('rect', {
        x: 0,
        y: y + height,
        width: bar_length,
        height: Math.abs(height),
        fill: Settings.editor.sv.factory_color,
        'fill-opacity': Settings.editor.sv.factory_opacity / 100
      }),
      h(
        'text',
        {
          x: bar_length / 2,
          y: y,
          fill: '#b8dcee',
          dy: '1.5rem',
          'text-anchor': 'middle'
        },
        `${factory_strings[x.type] ?? ''}`
      )
    ]
  }
  return [
    h('line', {
      x1: -50,
      x2: bar_length + 50,
      y1: time_bottom(x.time),
      y2: time_bottom(x.time),
      stroke: Settings.editor.sv.pointer_color,
      'stroke-width': Settings.editor.sv.pointer_width
    }),
    h(
      'text',
      {
        x: -50,
        y: time_bottom(x.time) - 5,
        fill: '#b8dcee'
      },
      `x${x.eff.toFixed(2)}`
    )
  ]
}

</script>

<template>
  <g
    id="svg-sv-line"
    transform="translate(50 -20)"
    @click="on_click"
    @contextmenu="on_right"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
    @mousemove="update_pending"
  >
    <rect fill="transparent" height="100%" opacity="0" width="100%" x="-50" y="0" />
    <template v-for="x in shown">
      <component :is="y" v-for="y in sv_single(x)" />
    </template>
    <component :is="sv_single(sv_pending)[0]" v-if="pending_display" />
    <text
      v-if="pending_display"
      :y="time_bottom(text_time)"
      :dx="pending_text_dx"
      dy="-0.5rem"
      fill="white"
      text-anchor="start"
      x="-50"
    >
      {{ text_time.toFixed(0) }}
    </text>
  </g>
</template>

<style scoped></style>
