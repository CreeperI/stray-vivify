<script lang="ts" setup>
import { Settings } from '@renderer/core/settings'
import { Charter } from '@renderer/core/charter'
import SvgBarText from '@renderer/components/chart-v2/svg-lane/svg-bar-text.vue'
import SvgBarLine from '@renderer/components/chart-v2/svg-lane/svg-bar-line.vue'
import SvgBeatLine from '@renderer/components/chart-v2/svg-lane/svg-beat-line.vue'
import SvgNotes from '@renderer/components/chart-v2/svg-lane/svg-notes.vue'
import SvgBottomBpm from '@renderer/components/chart-v2/svg-lane/svg-bottom-bpm.vue'

const lane_width = Settings.editor.lane_width
const svg_width = 4 * lane_width + 2 * 50 + 12
const bar_length = 4 * lane_width + 12
const view_port = [0, 0, svg_width, window.screen.height]
const _px = svg_width + 'px'

const chart = Charter.get_chart()

const shown = chart.diff.shown
</script>

<template>
  <div id="lane-wrapper" :style="{ flexBasis: _px }" class="lane-wrapper">
    <svg
      id="lane-svg"
      :viewBox="view_port.join(' ')"
      :width="svg_width"
      preserveAspectRatio="xMidYMax slice"
    >
      <rect fill="#000000" height="100%" width="100%" x="0" y="0"></rect>
      <svg-bar-text />
      <svg-bar-line />
      <rect :width="bar_length" fill="#131520" height="100%" x="50" y="0"></rect>
      <svg-beat-line />
      <slot>
        <svg-notes :shown="shown" />
      </slot>
      <rect
        id="svg-bottom-rect"
        :width="bar_length - 6"
        fill="#888"
        height="80"
        stroke="#ffffff"
        stroke-width="6"
        transform="translate(0 -80)"
        x="53"
        y="100%"
      />
      <g id="svg-particle"></g>
      <g transform="translate(50 0)">
        <rect fill="#ffffff" height="100%" width="6" x="0" y="0"></rect>
        <rect :x="lane_width * 4 + 6" fill="#ffffff" height="100%" width="6" y="0"></rect>
      </g>
      <svg-bottom-bpm />
    </svg>
  </div>
</template>

<style scoped>
.lane-wrapper {
  height: 100%;
  margin-right: 10px;
}

#lane-svg {
  bottom: 0;
  position: absolute;
  height: 100vh;
}

text {
  user-select: none;
}
</style>
