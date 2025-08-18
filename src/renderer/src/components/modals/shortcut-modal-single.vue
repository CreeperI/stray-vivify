<script setup lang="ts">
import { ShortCuts } from '@renderer/core/shortcut'
import { ref, watchEffect } from 'vue'

const { short, msg } = defineProps<{
  msg: string
  short: ShortCuts
}>()

const data = ref(short.data)
const parsed = ref(short.parse())
watchEffect(() => {
  short.set_data(data.value)
  parsed.value = short.parse()
})
const is_listen = ref(false)
function listen_keyboard() {
  is_listen.value = true
  ShortCuts.on_listening.value = true
  document.addEventListener(
    'keyup',
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      data.value = {
        key: e.key.toLowerCase(),
        alt: e.altKey,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        name: data.value.name
      }
      is_listen.value = false
      ShortCuts.on_listening.value = false
      console.log(short.parse())
    },
    { once: true }
  )
}
</script>

<template>
  <tr class="shortcut-single-line">
    <td style="width: 40%; text-align:right;">{{ msg }}</td>
    <td style="width: 10%;"></td>
    <td class="shortcut-single-btn" v-if="is_listen">请输入快捷键</td>
    <td class="shortcut-single-btn" @click="listen_keyboard" v-else>{{ parsed }}</td>
    <td></td>
  </tr>
</template>

<style scoped>
input[type='text'] {
  width: 7ch;
}
td {
  user-select: none;
}
.sc-msg {
  width: 30%;
}
.shortcut-single-btn{
  cursor: pointer;
  user-select: none;
  background-color: #00000066;
  width: 8rem;
}
</style>
