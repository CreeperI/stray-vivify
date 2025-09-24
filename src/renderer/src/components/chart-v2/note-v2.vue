<script lang="ts" setup>
import { ChartTypeV2 } from '@preload/types'
import { Charter } from '@renderer/core/charter'
import { Settings } from '@renderer/core/settings'

const { note } = defineProps<{
  note: ChartTypeV2.note
}>()
const mul = Charter.refs.mul
const lane_width = Settings.editor.lane_width

const note_style = 'stray:/__skin__'

function getSrc(): string {
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

function borderSrc(): string {
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

function size() {
  return lane_width * note.width + 'px'
}

function urlOf() {
  return `${getSrc()}`
}

function left() {
  return `${note.lane * lane_width + 6}px`
}

/*function border() {
  // @ts-expect-error here the len isnt guaranteed in typing but its only called
  // when its a ln so dont fuck it.
  const width = note.len * mul.value
  return `border-top: transparent solid ${width}px;` +
    `border-image-source: url("${getSrc().replace('.png', 'h.png')}");`+
    `border-image-outset: ${width}px;` +
    `border-image-repeat: stretch; border-image-slice: 43;`
}*/
function border() {
  // @ts-expect-error
  const width = note.len * mul.value
  const sliceHeight = 43 // 贴图实际高度（单位：px），按需替换为实际值
  return `border:none; border-top: transparent solid ${width}px;
    border-image-source: url("${borderSrc()}");
    border-image-slice: ${sliceHeight};
    border-image-repeat: stretch;
  `
}

function height() {
  return `${43 * (lane_width / 130)}px`
}

function zix() {
  if ('len' in note) return `z-index: ${5 - note.width}`
  else return `z-index: ${9 - note.width}`
}

function style() {
  if ('len' in note) {
    return `${zix()};height:${height()};width: ${size()}; left: ${left()}; ${border()};`
  } else {
    return `${zix()};width: ${size()}; left: ${left()}`
  }
}
</script>

<template>
  <img alt="" :src="urlOf()" :style="style()"/>
</template>

<style scoped>
img {
  width: min-content;
  user-select: none;
  display: block;
  position: absolute;
}
</style>
