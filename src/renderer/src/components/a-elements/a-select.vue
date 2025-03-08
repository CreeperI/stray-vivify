<script generic="T" lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  // cb: (n: T) => void
  options: { val: T; display: string }[]
}>()
const model = defineModel<T>()

const option: { val: T; display: string }[] = (() => {
  if (props.options.length == 0) return []
  if (typeof props.options[0] == 'object') {
    return props.options
  } else {
    return props.options.map((v) => {
      return { val: v, display: v }
    })
  }
})() as { val: T; display: string }[]

const val = computed(() => {
  return option.find((v) => v.val == model.value)?.display
})

const on_click = (val: T) => {
  model.value = val
}
</script>

<template>
  <div class="a-select">
    <div class="a-select-value" v-html="val" />
    <div class="a-option-wrapper">
      <div v-for="o in option" class="a-option" @click="() => on_click(o.val)" v-html="o.display" />
    </div>
  </div>
</template>

<style scoped>
.a-select {
  display: inline-block;
  min-width: 120px;
  text-align: left;
  user-select: none;
  position: relative;
  padding-left: 1em;
  border: 1px solid;
  margin: 0 10px;
}

.a-select-value:after {
  content: '\25BC';
  position: absolute;
  right: 2px;
  height: 100%;
  top: 50%;
  transform: translateY(-50%);
  text-align: center;
}

.a-option-wrapper {
  background: var(--dark-bgi);
  display: flex;
  flex-direction: column;
  position: absolute;
  transition: 0.1s linear opacity;
  top: calc(1em + 5px);
  border: 1px solid var(--grey);
  width: 100%;
  left: 0;
  box-sizing: border-box;
  opacity: 0;
  pointer-events: none;
}

.a-select:hover .a-option-wrapper {
  opacity: 1;
  pointer-events: all;
  z-index: var(--z-highest);
}

.a-option {
  background-color: transparent;
  line-height: 1.5em;
  text-align: left;
  height: 1.5em;
  padding-left: 1em;
}
</style>
