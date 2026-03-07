<script lang="ts" setup>
import NoteV2 from '@renderer/components/chart-v2/note-v2.vue'
import { computed, inject, onMounted, onUnmounted, ref, toRaw } from 'vue'
import { Storage } from '@renderer/core/storage'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart, event_time } from '@renderer/core/chart/chart'
import { utils } from '@renderer/core/utils'
import { useUpdateFrameRate } from '@renderer/core/misc/frame-rates'
import { notify } from '@renderer/core/misc/notify'
import { ChartTypeV2 } from '@preload/chart-types'
import { Chart_diff } from '@renderer/core/chart/diff'
import useSvgSizing = GlobalStat.useSvgSizing

useUpdateFrameRate('svg-notes')
const chart = Chart.$current
const { diff_index = -1, disable_pending = false } = defineProps<{
  diff_index?: number
  disable_pending?: boolean
}>()
// const force_playing = ref(false)
const not_playing_class = computed(
  () =>
    // chart.audio.refs.paused.value && !force_playing.value ? 'not-playing' : ''
    ''
)
const diff = diff_index == -1 ? chart.diff : Chart_diff.useCreateDiff(chart, diff_index)
console.log(`loaded diff: ${diff.diff_index.value}`, JSON.stringify(diff.diff.meta))
const get_note = diff.get_note
const to_note = diff.to_note

const lane_width = inject<number>('lane_width') ?? Storage.settings.lane_width
const { svg_width, bar_length } = useSvgSizing()
const offset1 = Storage.settings.offset1

const shown = diff.shown
const mul = Storage.computes.mul
const current_time = chart.audio.refs.current_ms

// ------------ pending --------------
const pending_time = ref(0)
const pending_lane = ref(0)
const pending_snm = ref(0)
const pending_len = ref(0)
const pending_display = ref(false)
const dragging = ref<number[]>()
let dragging_base_time = 0
let dragging_base_lane = 0
let dragging_delta = 0
let pending_hold_fixed = false
let pending_hold_fixed_time = 0
const pending_note = computed(() => {
  if (disable_pending) return []
  if (dragging.value?.length) {
    return dragging.value.map((ix) => {
      const x = to_note(ix)
      return {
        ...x,
        time: pending_time.value + (x.time - dragging_base_time) - dragging_delta,
        lane: pending_lane.value + (x.lane - dragging_base_lane)
      }
    })
  } else if (clipboard.value.length) {
    return clipboard.value.map((x) => {
      const _note = to_note(x)
      return {
        ..._note,
        time: pending_time.value + _note.time
      }
    })
  }
  return [
    Storage.note.h
      ? ({
          time: pending_time.value,
          lane: pending_lane.value,
          width: Storage.note.w,
          len: pending_len.value
        } as ChartTypeV2.hold_note)
      : ({
          time: pending_time.value,
          lane: pending_lane.value,
          width: Storage.note.w,
          snm: pending_snm.value
        } as ChartTypeV2.normal_note)
  ]
})

utils.stopWatch(chart.audio.refs.paused, (v) => {
  if (!v) {
    pending_display.value = false
    pending_hold_fixed = false
  }
})

function update_pending_display(_trigger: 'enter' | 'leave' | 'note') {
  if (GlobalStat.chart_state.value != 0) return
  if (Storage.note.w == 0) pending_display.value = false
  else if (_trigger == 'note') {
    if (pending_hold_fixed) return
    pending_display.value = false
  } else if (_trigger == 'enter') pending_display.value = true
  else if (_trigger == 'leave') {
    pending_display.value = false
    fuck_hold()
  }
}

function update_pending(e: MouseEvent) {
  if (GlobalStat.chart_state.value != 0) return
  if (!chart.audio.paused || disable_pending) return
  if (e.target instanceof HTMLImageElement) {
    return
  }
  const mouse_time = event_time(e, chart, mul.value, current_time.value)
  if (pending_hold_fixed) {
    pending_len.value = Math.abs(mouse_time - pending_hold_fixed_time)
    if (mouse_time <= pending_hold_fixed_time) {
      // so the user is 倒着拉条
      pending_time.value = pending_hold_fixed_time - pending_len.value
    }
    return
  }
  // this is initial value referring the % of the mouse
  let lane: number = utils.clamp((e.offsetX - 56) / bar_length, 0, 1)
  const max_lane = diff.max_lane.value
  const width = dragging.value
    ? utils.range(
        ...dragging.value
          .map((ix) => {
            const x = to_note(ix)
            return [x.lane, x.lane + x.width]
          })
          .flat()
      )
    : Storage.note.w
  lane = utils.clamp(Math.floor(lane * (diff.max_lane.value - width + 1)), 0, max_lane - width)

  pending_time.value = mouse_time
  pending_lane.value = lane
  pending_snm.value = Storage.note.snm

  pending_display.value = pending_time.value >= 0
}

function on_click() {
  if (GlobalStat.chart_state.value != 0) return
  if (clipboard.value.length) return
  if (disable_pending) return
  if (Storage.note.w == 0) return

  if (Storage.note.hold.value) {
    if (pending_hold_fixed) {
      if (!diff.add_notes_with_undo(toRaw(pending_note.value))) notify.error('添加note失败。')
      pending_len.value = 0
      pending_hold_fixed = false
    } else {
      pending_hold_fixed = true
      pending_hold_fixed_time = pending_time.value
    }
    return
  } else {
    if (!diff.add_notes_with_undo(toRaw(pending_note.value))) notify.error('添加note失败。')
  }
}

function del_note(n: number) {
  if (disable_pending) return
  if (pending_hold_fixed) return
  if (selected.value.includes(n)) {
    diff.remove_note_with_undo(...selected.value)
    return
  }
  if (!diff.remove_note_with_undo(to_note(n))) notify.error('删除note失败。')
}

function fuck_hold() {
  pending_hold_fixed = false
  pending_len.value = 0
  pending_hold_fixed_time = 0
}

// ------------------- Dragging -------------------
const opacity = computed(() => {
  if (dragging.value == undefined) return 0.7
  else return 1
})
function ondragstart(e: DragEvent, n: number) {
  if (disable_pending) return
  dragging.value = [n]
  if (selected.value) {
    if (selected.value.includes(n)) {
      dragging.value = selected.value
    }
    dragging_base_lane = Math.min(...dragging.value.map((x) => to_note(x).lane))
    dragging_base_time = Math.min(...dragging.value.map((x) => to_note(x).time))
    dragging_delta = to_note(n).time - dragging_base_time
  }
  pending_hold_fixed = false
  pending_len.value = 0
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
  }
}
function ondragend() {
  dragging.value = undefined
  selected.value = []
}
function ondrop() {
  if (!dragging.value) return
  if (!disable_pending) return

  if (!diff.remove_note_with_undo(...dragging.value)) console.log('bugged removing')

  diff.add_notes_with_undo(pending_note.value)
  dragging.value = undefined
}
// ----------------- selector ---------------------
const NoteClipboard = GlobalStat.NoteClipboard
const selected = NoteClipboard.selected
const clipboard = NoteClipboard.clipboard

let select_start_time = 0
let select_start_offsetX = 0
let select_start_delta = 0
let select_start_screenX = 0
let select_start_screenY = 0

let select_last_screen = [0, 0]

let is_selecting = false
const select_state = ref(false)

const select_rect = ref({
  x: 0,
  y: 0,
  shown: false,
  height: 0,
  width: 0
})

function on_mouse_down(e: MouseEvent) {
  if (e.target instanceof HTMLImageElement) return
  if (Storage.note.w != 0) return
  if (disable_pending) return
  if (clipboard.value.length) {
    NoteClipboard.paste()
    return
  }
  is_selecting = true
  select_state.value = true
  select_rect.value.shown = true
  select_rect.value.x = 0
  select_rect.value.height = 0
  select_rect.value.y = (select_start_time - current_time.value - offset1) * mul.value

  select_start_screenY = e.screenY
  select_start_screenX = e.screenX

  const bottom = screen.availHeight - 125 - e.offsetY
  select_start_time = Math.floor(bottom / mul.value + current_time.value)
  select_start_offsetX = e.offsetX
  select_start_delta = select_start_time - current_time.value
  document.addEventListener('mouseup', on_mouse_up, { once: true })
  document.addEventListener('mousemove', select_mouse_move, { passive: true })
}

function select_cleanup() {
  is_selecting = false
  select_rect.value.shown = false
  select_start_time = 0
  document.removeEventListener('mousemove', select_mouse_move)
}

function on_mouse_up(e: MouseEvent) {
  if (disable_pending) return
  if (!is_selecting) {
    select_cleanup()
    return
  }
  const dy = e.screenY - select_start_screenY
  const mouse_time = current_time.value - dy / mul.value + select_start_delta

  // main select logic
  const lane0 = ((e.offsetX - 56) / (svg_width - 112)) * 4
  const lane1 = ((select_start_offsetX - 56) / (svg_width - 112)) * 4
  const lane_min = Math.min(lane0, lane1)
  const lane_max = Math.max(lane0, lane1)

  const time0 = Math.min(mouse_time, select_start_time)
  const time1 = Math.max(mouse_time, select_start_time)

  if (e.ctrlKey) {
    selected.value.push(
      ...utils.indexes_of(diff.notes, (n, ix) => {
        if (n.time >= time0 && n.time <= time1) {
          if (selected.value.includes(ix)) return false
          if (n.lane + 0.25 >= lane_min && n.lane - 0.25 <= lane_max) return true
        }
        return false
      })
    )
  } else
    selected.value = utils.indexes_of(diff.notes, (n) => {
      if (n.time >= time0 && n.time <= time1)
        if (n.lane + 0.25 >= lane_min && n.lane - 0.25 <= lane_max) return true
      return false
    })

  NoteClipboard.copy = () => {
    const min = Math.min(...selected.value.map((x) => to_note(x).time))
    clipboard.value = selected.value.map((ix) => {
      const x = to_note(ix)
      return { ...x, time: x.time - min }
    })
    selected.value = []
    select_state.value = false
    NoteClipboard.copy = () => {}
    NoteClipboard.cut = () => {}
  }

  NoteClipboard.cut = () => {
    const min = Math.min(...selected.value.map((x) => to_note(x).time))
    clipboard.value = selected.value.map((ix) => {
      const x = to_note(ix)
      return { ...x, time: x.time - min }
    })
    if (!disable_pending) diff.remove_note_with_undo(...selected.value)
    selected.value = []
    select_state.value = false
    NoteClipboard.copy = () => {}
    NoteClipboard.cut = () => {}
  }

  NoteClipboard.paste = () => {
    if (!disable_pending) diff.add_notes_with_undo(pending_note.value)
    select_state.value = false
    clipboard.value = []
    NoteClipboard.paste = () => {}
  }

  // cleanup
  select_cleanup()
}

function select_mouse_move(e: MouseEvent) {
  if (!is_selecting) return

  select_last_screen = [e.screenX, e.screenY]
  const dy = e.screenY - select_start_screenY
  const mouse_time = current_time.value - dy / mul.value + select_start_delta
  select_rect.value.width = Math.abs(e.screenX - select_start_screenX)
  if (e.screenX > select_start_screenX) select_rect.value.x = select_start_offsetX
  else select_rect.value.x = select_start_offsetX + (e.screenX - select_start_screenX)

  // 52 = 100 - 32 - 16 (?
  // dragging to later of song
  // if (dy < 0)
  // select_rect.value.y = screen.availHeight - 52 - Math.max(mouse_time, select_start_time) * mul.value - select_rect.value.height
  const y1 = screen.height - 96 - (select_start_time - current_time.value) * mul.value
  const y2 = screen.height - 96 - (mouse_time - current_time.value) * mul.value
  // select_rect.value.y = Math.min(y1, y2)

  select_rect.value.y = Math.min(y1, y2)
  select_rect.value.height = Math.abs(y1 - y2)
}
function am_i_selected(n: number) {
  return selected.value.includes(n)
}
function change_my_select(n: number) {
  const ix = selected.value.findIndex((x) => x == n)
  if (ix == -1) selected.value.push(n)
  else selected.value.splice(ix, 1)
}

function x_of(note: ChartTypeV2.note) {
  return note.lane * lane_width + 56 + 'px'
}
function fuck_wheel(e: WheelEvent) {
  if (GlobalStat.chart_state.value != 0) return
  if (e.ctrlKey || e.altKey) return
  chart.audio.pause()
  if (!e.target) return

  const current_time = chart.audio.current_time
  const meter = Storage.settings.meter
  const current_bpm = diff.bpm_of_time(current_time)?.bpm ?? 120

  chart.audio.set_current_time(diff.nearest(current_time))
  const scr = Math.round((4 / meter) * (60 / current_bpm) * Math.sign(e.deltaY) * 1000)
  if (Storage.settings.reverse_scroll) {
    chart.audio.set_current_time(chart.audio.current_time + scr)
  } else {
    chart.audio.set_current_time(chart.audio.current_time - scr)
  }
  const move_event = new MouseEvent('mousemove', {
    screenX: select_last_screen[0],
    screenY: select_last_screen[1]
  })
  if (is_selecting) select_mouse_move(move_event)
}
const top_id = inject<string>('lane_id', '')
onMounted(() => {
  let id = setInterval(() => {
    const lw = document.getElementById(top_id)
    if (!lw) return
    lw.addEventListener('wheel', fuck_wheel)
    clearInterval(id)
  }, 500)

  diff.fuck_shown(chart.audio.current_time, true)
})
onUnmounted(() => {
  document.getElementById(top_id)?.removeEventListener('wheel', fuck_wheel)
})

const pointer_class = computed(() => {
  return (dragging.value != undefined ? 'pt-dragging' : '') + (is_selecting ? ' pt-selecting' : '')
})
const d_height = inject<number>('d_height') ?? 0
</script>

<template>
  <g v-bind="$attrs"
    id="svg-notes"
    :class="not_playing_class"
    @mouseenter="() => update_pending_display('enter')"
    @mouseleave="() => update_pending_display('leave')"
  >
    <foreignObject
      id="lane-notes"
      :class="pointer_class"
      :y="-80 + d_height"
      height="100%"
      width="100%"
      @click="on_click"
      @contextmenu="fuck_hold"
      @drop="ondrop"
      @mousedown="(e) => on_mouse_down(e)"
      @mousemove.capture="update_pending"
      @dragover.prevent="update_pending"
    >
      <note-v2
        v-for="ix in shown"
        :key="ix"
        :data-is-dragged="dragging?.includes(ix)"
        :data-is-selected="am_i_selected(ix)"
        :note="get_note(ix)"
        :style="{
          left: x_of(get_note(ix))
        }"
        :title="ix"
        data-shown-note
        @dragend="ondragend"
        @dragstart="(e) => ondragstart(e, ix)"
        @click.right="del_note(ix)"
        @click.ctrl="change_my_select(ix)"
      />
      <template v-if="pending_display">
        <note-v2
          v-for="note in pending_note"
          :note="note"
          :style="{
            left: x_of(note),
            opacity: opacity
          }"
          style="pointer-events: none; z-index: 10"
        />
      </template>
    </foreignObject>
  </g>
  <rect
    v-if="select_rect.shown"
    :height="select_rect.height"
    :width="select_rect.width"
    :x="select_rect.x"
    :y="select_rect.y"
    class="no-event select-rect"
    fill="#b8dcee"
    opacity="0.6"
  ></rect>
</template>

<style scoped>
.not-playing > * > img[data-shown-note] {
  transition: bottom 0.1s cubic-bezier(0, 0, 0, 0.7);
}
.pt-dragging {
  cursor: grabbing;
}
.pt-selecting > img {
  pointer-events: none;
}
</style>
