<script setup lang="ts">
import { ref } from 'vue'
import { ChartTypeV2 } from '@preload/types'
import { Chart } from '@renderer/core/chart/chart'

type normal_note = ChartTypeV2.normal_note

type hold_note = ChartTypeV2.hold_note

type note = ChartTypeV2.note

type RenderElement = [string, number, number, number, number] // [src, x, y, height, width]

// Constants
const LANE_WIDTH = 40 // pixels per lane
const NOTE_HEIGHT = 13 // pixels
const CHART_WIDTH = 4 * LANE_WIDTH // 4 lanes = 160px
const CHART_GAP = 50
const PADDING = 50
const chart = Chart.$current
const ms_to_px = 0.7
const inf_height = 250

const timeRange = (() => {
  const minTime = Math.min(...chart.diff.notes.map((n) => n.time))
  const maxTime = Math.max(
    ...chart.diff.notes.map((n) => {
      if ('len' in n) {
        return n.time + n.len
      }
      return n.time
    })
  )

  return {
    min: minTime,
    max: maxTime,
    total: maxTime
  }
})()

const totalPixelHeight = timeRange.total * ms_to_px
const max_height = Math.floor(Math.sqrt(totalPixelHeight * (CHART_GAP + CHART_WIDTH)))
const layoutInfo = (() => {
  const columnsNeeded = Math.ceil(totalPixelHeight / max_height)
  const timePerColumn = timeRange.total / columnsNeeded

  return {
    totalPixelHeight,
    columnsNeeded: columnsNeeded,
    timePerColumn
  }
})()

const inf_base = max_height + 50
const svg_height = inf_height + 10 + max_height

const img_able = ref(true)
const src = `stray:/__sprite__/${chart.id}`

const note_style = 'stray:/__skin__'
function src_of(note: note): string {
  if (note.width == 0) return ''
  let str = note_style + '/' + note.width
  if ('snm' in note) {
    if (note.snm == 1) return str + 'b.png'
    if (note.snm == 2 && note.width != 1) str += 's'
  }
  if (note.width == 2) {
    str += note.lane == 0 ? 'l' : note.lane == 2 ? 'r' : 'm'
  } else if (note.width == 3) {
    str += note.lane == 0 ? 'l' : 'r'
  }
  return str + '.png'
}

function src_of_len(note: hold_note): string {
  let str = note_style + '/' + note.width
  if (note.width == 1) {
    switch (note.lane) {
      case 0:
      case 1:
        str += 'l'
        break
      case 2:
      case 3:
        str += 'r'
        break
    }
  } else if (note.width == 2) {
    str += note.lane == 0 ? 'l' : note.lane == 2 ? 'r' : 'm'
  } else if (note.width == 3) {
    str += note.lane == 0 ? 'l' : 'r'
  }
  return str + 'h.png'
}


const svgWidth = layoutInfo.columnsNeeded * (CHART_WIDTH + CHART_GAP) + 2 * PADDING

// Helper function to get base x coordinate for a column (lane 0 position)
function getColumnBaseX(column: number): number {
  return PADDING + column * (CHART_WIDTH + CHART_GAP)
}

// Independent function to convert time to coordinate [x, y] for lane 0
function timeToCoordinate(time: number): [number, number] {
  const relativeTime = time - timeRange.min
  const column = Math.floor(relativeTime / layoutInfo.timePerColumn)
  const timeInColumn = relativeTime - column * layoutInfo.timePerColumn

  // In rhythm games, earlier notes appear at the bottom, later notes at the top
  // So we invert the y coordinate
  const y = Math.round(max_height - timeInColumn * ms_to_px + PADDING / 2)
  const x = getColumnBaseX(column) // Lane 0 position

  return [x, y]
}

// Helper function to convert time to pixel coordinates with column info
function timeToPixel(time: number): { column: number; y: number } {
  const relativeTime = time - timeRange.min
  const column = Math.floor(relativeTime / layoutInfo.timePerColumn)
  const timeInColumn = relativeTime - column * layoutInfo.timePerColumn

  // In rhythm games, earlier notes appear at the bottom, later notes at the top
  // So we invert the y coordinate
  const y = Math.round(max_height - timeInColumn * ms_to_px + PADDING / 2)

  return { column, y }
}

// Helper function to get x coordinate for a lane
function laneToX(lane: number, column: number): number {
  return getColumnBaseX(column) + lane * LANE_WIDTH
}

// Main render function
function get_render_elements(): RenderElement[] {
  const result: RenderElement[] = []

  if (chart.diff.notes.length === 0) return result

  // Process each note
  for (const note of chart.diff.notes) {
    const noteWidth = note.width * LANE_WIDTH

    if ('len' in note) {
      // Hold note
      const holdNote = note as hold_note
      const startPos = timeToPixel(holdNote.time)
      const endPos = timeToPixel(holdNote.time + holdNote.len)

      // Add the start note (head of hold)
      const startX = laneToX(holdNote.lane, startPos.column)
      result.push([
        src_of(holdNote),
        startX,
        startPos.y - NOTE_HEIGHT, // Adjust y to position note correctly
        NOTE_HEIGHT,
        noteWidth
      ])

      // Add the hold length part
      // Handle case where hold note spans multiple columns
      if (startPos.column === endPos.column) {
        // Hold note is within single column
        const lengthHeight = Math.abs(endPos.y - startPos.y)
        const lengthX = laneToX(holdNote.lane, startPos.column)
        result.push([
          src_of_len(holdNote),
          lengthX,
          Math.min(startPos.y, endPos.y) - NOTE_HEIGHT,
          lengthHeight,
          noteWidth
        ])
      } else {
        // Hold note spans multiple columns - need to split it
        for (let col = startPos.column; col <= endPos.column; col++) {
          let segmentStartY: number
          let segmentEndY: number

          if (col === startPos.column) {
            // First column: from start position to bottom of column
            segmentStartY = startPos.y
            segmentEndY = PADDING / 2
          } else if (col === endPos.column) {
            // Last column: from top of column to end position
            segmentStartY = max_height + PADDING / 2
            segmentEndY = endPos.y
          } else {
            // Middle columns: full height
            segmentStartY = max_height + PADDING / 2
            segmentEndY = PADDING / 2
          }

          const segmentHeight = Math.abs(segmentStartY - segmentEndY)
          if (segmentHeight > 0) {
            const segmentX = laneToX(holdNote.lane, col)
            result.push([
              src_of_len(holdNote),
              segmentX,
              Math.min(segmentStartY, segmentEndY) - NOTE_HEIGHT,
              segmentHeight,
              noteWidth
            ])
          }
        }
      }
    } else {
      // Normal note
      const normalNote = note as normal_note
      const pos = timeToPixel(normalNote.time)
      const x = laneToX(normalNote.lane, pos.column)

      result.push([
        src_of(normalNote),
        x,
        pos.y - NOTE_HEIGHT, // Adjust y to position note correctly
        NOTE_HEIGHT,
        noteWidth
      ])
    }
  }

  return result
}

const render_notes = get_render_elements()
const cd_of_bar_list = (() => {
  const r: { x1: number; y1: number; x2: number; y2: number; ix: string }[] = []
  chart.diff.update_bar_list()
  const timing_times = chart.diff.timing.map((t) => t.time)
  for (let i = 0; i < chart.diff.bar_list.length; i++) {
    const time = chart.diff.bar_list[i]
    if (time > timeRange.max) break
    const cd = timeToCoordinate(time)
    r.push({
      x1: cd[0],
      y1: cd[1] - 6,
      x2: cd[0] + CHART_WIDTH,
      y2: cd[1] - 6,
      ix: timing_times.includes(time) ? '' : i.toString()
    })
  }
  return r
})()

const cd_of_timing_list = (() => {
  const r: { x: number; y: number; timing: ChartTypeV2.timing; ix: number }[] = []
  let start = chart.diff.timing.findLastIndex((t) => t.time < timeRange.min)
  if (start < 0) start = 0
  else {
    const first_timing = chart.diff.timing[start]
    const cd = timeToCoordinate(timeRange.min)
    r.push({
      x: cd[0],
      y: cd[1] - 6,
      timing: first_timing,
      ix: start + 1
    })
    start += 1
  }
  for (let i = start; i < chart.diff.timing.length; i++) {
    const timing = chart.diff.timing[i]
    const cd = timeToCoordinate(timing.time)
    r.push({
      x: cd[0],
      y: cd[1] - 6,
      timing: timing,
      ix: i +1
    })
  }
  return r
})()

const cd_of_ticks = (() => {
  const r: { x: number; y: number; tick: number }[] = []
  chart.diff.update_tick_list()
  for (let i = 0; i < chart.diff.ticks.length; i++) {
    const cd = timeToCoordinate(chart.diff.ticks[i][0])
    r.push({
      x: cd[0] + CHART_WIDTH + 3,
      y: cd[1] - 6,
      tick: chart.diff.ticks[i][1]
    })
  }
  return r
})()
</script>
<template>
  <svg :width="svgWidth" :height="svg_height" id="chart-preview-svg">
    <rect x="0" y="0" height="100%" width="100%" fill="black" />
    <text x="50" y="100%" dy="-10px" font-size="20" fill="gray">Generated by stray/vivify (TerminalFlow)</text>
    <g>
      <rect
        v-for="c in layoutInfo.columnsNeeded"
        :x="getColumnBaseX(c - 1)"
        y="10"
        :width="CHART_WIDTH"
        :height="max_height + 30"
        fill="#131520"
      ></rect>
    </g>
    <g>
      <template v-for="bar in cd_of_bar_list" :key="'bar-' + bar.ix">
        <line
          :x1="bar.x1"
          :y1="bar.y1"
          :x2="bar.x2"
          :y2="bar.y2"
          stroke="red"
          stroke-width="2"
        ></line>
        <text
          :x="bar.x1"
          :y="bar.y1"
          font-size="1rem"
          text-anchor="end"
          fill="white"
          dy="0.4rem"
          dx="-3px"
        >
          {{ bar.ix }}
        </text>
      </template>
    </g>
    <g>
      <template v-for="timing in cd_of_timing_list" :key="'timing-' + timing.ix">
        <text :x="timing.x" :y="timing.y" text-anchor="end" fill="pink" font-size="15">
          #{{ timing.ix }}
        </text>
        <text
          :x="timing.x"
          :y="timing.y"
          text-anchor="end"
          fill="pink"
          font-size="15"
          dy="15"
        >
          {{ timing.timing.bpm }}
        </text>
      </template>
    </g>
    <g>
      <image
        v-for="(element, index) in render_notes"
        :key="'note-' + index"
        :href="element[0]"
        :x="element[1]"
        :y="element[2]"
        :height="element[3]"
        :width="element[4]"
        preserveAspectRatio="xMidYMid slice"
      />
    </g>
    <g>
      <text
        v-for="(tick, index) in cd_of_ticks"
        :key="'tick-' + index"
        :x="tick.x"
        :y="tick.y"
        font-size="12px"
        text-anchor="start"
        fill="gray"
        dy="6px"
      >
        {{ tick.tick }}
      </text>
    </g>
    <g>
      <image
        v-if="img_able"
        :xlink:href="src"
        height="175"
        preserveAspectRatio="xMinYMid"
        @error="img_able = false"
        :y="inf_base"
        x="50"
      />
      <image v-else xlink:href="/song.jpg" height="150" :y="inf_base + 20" x="50" width="150" />

      <text text-anchor="end" x="100%" :y="inf_base + 75" dx="-50px" font-size="50" fill="white">
        {{ chart.song.name }} - {{ chart.song.composer }}
      </text>
      <text text-anchor="end" x="100%" :y="inf_base + 150" dx="-50px" font-size="25" fill="#bbb">
        {{ chart.diff.diff1 }}-{{ chart.diff.diff2 }} by {{ chart.diff.charter }}
      </text>
    </g>
  </svg>
</template>
