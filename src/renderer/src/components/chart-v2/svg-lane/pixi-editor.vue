<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { onMounted, useTemplateRef } from 'vue'
import { DiffDrawer } from '@renderer/core/chart/drawer'
import { Storage } from '@renderer/core/storage'
import { EventHub } from '@renderer/core/misc/eventhub'
import { GlobalStat } from '@renderer/core/globalStat'
import { editable_note_drawer } from '@renderer/core/chart/edit-drawer'

const { lane_width = Storage.settings.lane_width, x_expand = 0 } = defineProps<{
  lane_width?: number
  x_expand?: number
  diff_index?: number
}>()

const chart = Chart.$current
const diff = chart.diff

const container = useTemplateRef<HTMLDivElement>('pixi-container')
const width = diff.max_lane.value * lane_width + x_expand + 2 * 50
const drawer = new DiffDrawer(diff, { lane_width, total_width: width, x_expand })
onMounted(() => {
  const editor = editable_note_drawer.call(drawer, chart)
  drawer.drawers.notes.container.removeFromParent()
  drawer.drawers.notes = editor.note_drawer
  drawer.app.stage.addChild(drawer.drawers.notes.container)

  drawer.drawers.ln.container.removeFromParent()
  drawer.drawers.ln = editor.ln_drawer
  drawer.app.stage.addChild(drawer.drawers.ln.container)

  drawer.app.stage.addChild(
    editor.shadow.drawer.container,
    editor.pending.drawer.note.container,
    editor.pending.drawer.ln.container
  )
  editor.listen_handle()

  drawer.init({ width: width }).then(() => {
    container.value?.appendChild(drawer.app.canvas)
    drawer.app.canvas.addEventListener('mousemove', editor.update_pending, true)
    drawer.app.canvas.addEventListener('mouseenter', editor.mousein)
    drawer.app.canvas.addEventListener('mouseleave', editor.mouseout)
    drawer.app.canvas.addEventListener('click', (e) => editor.pending.on_click(e))
    drawer.app.canvas.addEventListener('mouseup', () => {
      editor.pending.drop()
      editor.shadow.show()
    })
    diff.force_fuck()
    EventHub.dispatch('audio-time-update')
    container.value?.focus()
  })
})
function fuck_wheel(e: WheelEvent) {
  if (GlobalStat.chart_state.value != 0) return
  if (e.ctrlKey || e.altKey) return
  chart.audio.pause()
  if (!e.target) return

  chart.scr_time(e.deltaY)
}
defineExpose({ drawer: drawer })
</script>

<template>
  <div
    ref="pixi-container"
    :style="{ width: width + 'px' }"
    class="pixi-container"
    @wheel.capture="fuck_wheel"
  />
</template>

<style>
.pixi-container {
  position: relative;
}
.pixi-container > canvas {
  position: absolute;
  bottom: 0;
}
</style>
