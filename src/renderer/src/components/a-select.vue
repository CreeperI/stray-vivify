<script generic="T" lang="ts" setup>
import { computed, ref } from 'vue'

const props = defineProps<{
  // cb: (n: T) => void
  options: T[] | { val: T; key: string }[]
}>()
const model = defineModel<T>()

const clicked = ref(false)

/*function l() {
  if (!clicked.value) {
    document.addEventListener('click', l, { once: true })
    return
  }
  if (document.activeElement != templateRef.value) {
    clicked.value = false
  }
}

document.addEventListener('click', l, { once: true })*/

const option: { val: T; key: string }[] = (() => {
  if (props.options.length == 0) return []
  if (typeof props.options[0] == 'object') {
    return props.options
  } else {
    return props.options.map((v) => {
      return { val: v, key: v }
    })
  }
})() as { val: T; key: string }[]

const val = computed(() => {
  return option.find((v) => v.val == model.value)?.key
})
const on_click = (val: T) => {
  clicked.value = false
  model.value = val
}
</script>

<template>
  <div class="a-select" @click="clicked = !clicked" @mouseleave="clicked = false">
    <div class="a-select-value" v-html="val" />
    <div v-show="clicked" class="a-option-wrapper">
      <div v-for="o in option" class="a-option" @click="() => on_click(o.val)" v-html="o.key" />
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
  border: 1px solid var(--grey);
  margin: 0 10px;
}

.a-select-value:after {
  content: '\25BC';
  position: absolute;
  right: 0;
  line-height: 100%;
  height: 100%;
  text-align: center;
}

.a-option-wrapper {
  background: var(--common-bgi);
  display: flex;
  flex-direction: column;
  position: absolute;
  transition: 0.2s linear all;
  top: calc(1em + 5px);
  border: 1px solid var(--grey);
  width: 100%;
  left: 0;
  box-sizing: border-box;
}

.a-option {
  background-color: transparent;
  line-height: 1.5em;
  text-align: left;
  height: 1.5em;
  padding-left: 1em;
}
</style>
