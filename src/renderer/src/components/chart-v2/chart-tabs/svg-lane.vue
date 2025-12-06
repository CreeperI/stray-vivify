<script lang="ts" setup>
import { Storage } from '@renderer/core/storage'
import SvgBarText from '@renderer/components/chart-v2/svg-lane/svg-bar-text.vue'
import SvgBpmText from '@renderer/components/chart-v2/svg-lane/svg-bpm-text.vue'
import SvgBeatLine from '@renderer/components/chart-v2/svg-lane/svg-beat-line.vue'
import SvgNotesEditor from '@renderer/components/chart-v2/svg-lane/svg-notes-editor.vue'
import SvgBottomBpm from '@renderer/components/chart-v2/svg-lane/svg-bottom-bpm.vue'
import SvgTicks from '@renderer/components/chart-v2/svg-lane/svg-ticks.vue'
import { Chart } from '@renderer/core/chart/chart'
import { GlobalStat } from '@renderer/core/globalStat'
import { utils } from '@renderer/core/utils'
import SvgSection from '@renderer/components/chart-v2/svg-lane/svg-section.vue'
import { computed, provide } from 'vue'

const svg_sizing = GlobalStat.SvgSizing
const { lane_width = Storage.settings.lane_width, only_note = false } = defineProps<{
  lane_width?: number
  only_note?: boolean
}>()

const id = `lane-wrapper-${Math.random().toFixed(4)}`
svg_sizing.max_lane = Chart.$current.diff.max_lane.value
svg_sizing.svg_width = svg_sizing.max_lane * lane_width + 2 * 50 + 12
svg_sizing.bar_length = svg_sizing.max_lane * lane_width + 12
svg_sizing.view_port = [0, 0, svg_sizing.svg_width, window.screen.height]

const _px = svg_sizing.svg_width + 'px'
const rkey = utils.refresh_key

const bar_or_section = computed(() => Storage.settings.bar_or_section)

provide('lane_width', lane_width)
provide('d_height', (lane_width / 130 - 1) * 43 * 0.5)
provide('lane_id', id)
</script>

<template>
  <div :id="id" :style="{ flexBasis: _px }" class="lane-wrapper">
    <svg
      :key="rkey"
      :viewBox="svg_sizing.view_port.join(' ')"
      :width="svg_sizing.svg_width"
      class="lane-svg"
      preserveAspectRatio="xMidYMax slice"
    >
      <rect fill="#000000" height="100%" width="100%" x="0" y="0"></rect>
      <template v-if="!only_note">
        <svg-section v-if="bar_or_section" />
        <svg-bar-text v-else />
        <svg-bpm-text />
      </template>
      <rect :width="svg_sizing.bar_length" fill="#131520" height="100%" x="50" y="0"></rect>
      <template v-if="!only_note">
        <svg-beat-line />
        <svg-ticks />
      </template>
      <slot>
        <svg-notes-editor />
      </slot>
      <rect
        id="svg-bottom-rect"
        :width="svg_sizing.bar_length - 6"
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
        <rect class="no-event" fill="#ffffff" height="100%" width="6" x="0" y="0" />
        <rect
          :x="lane_width * svg_sizing.max_lane + 6"
          class="no-event"
          fill="#ffffff"
          height="100%"
          width="6"
          y="0"
        />
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

.lane-svg {
  bottom: 0;
  position: absolute;
  height: 100%;
}

text {
  user-select: none;
}
</style>
