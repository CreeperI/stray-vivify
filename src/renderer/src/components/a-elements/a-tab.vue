<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const model = defineModel<number>({ default: -1 })

const containerRef = ref<HTMLDivElement | null>()

function handleClick(e: MouseEvent) {
  const container = containerRef.value
  if (!container) return

  let target = e.target as HTMLDivElement

  if (target.getAttributeNode("disabled")?.value == "true") return
  while (target !== container && target.parentNode) {
    if (target.parentNode === container && target.tagName === 'DIV') {
      // 找到有效的子项
      const children = Array.from(container.children).filter(
        (el): el is HTMLDivElement => el.tagName === 'DIV'
      )
      const index = children.indexOf(target)
      if (index >= 0) {
        model.value = index
      }
      return
    }
    target = target.parentNode as HTMLDivElement
  }
}

function updateChosenClass() {
  const container = containerRef.value
  if (!container) return

  const children = Array.from(container.children).filter(
    (el): el is HTMLDivElement => el.tagName === 'DIV'
  )

  children.forEach((child, i) => {
    if (i === model.value) {
      child.classList.add('a-tab-chosen')
    } else {
      child.classList.remove('a-tab-chosen')
    }
  })
}

watch(model, updateChosenClass)

onMounted(() => {
  updateChosenClass()
})
</script>

<template>
  <div ref="containerRef" class="a-tab" @click="handleClick">
    <slot></slot>
  </div>
</template>

<style>
.a-tab {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  margin-bottom: 5px;
}

.a-tab > div {
  flex-grow: 1;
  text-align: center;
  border: 2px solid #b8dcee;
  border-right: none;
  padding: 3px;
  background: #0d1418;
  cursor: pointer;
  transition: background-color 0.2s linear;
}

.a-tab > div:last-child {
  border-right: 2px solid #b8dcee;
}

.a-tab-chosen {
  background: #3b4652 !important;
}
</style>
