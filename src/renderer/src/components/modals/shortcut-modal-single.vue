<script lang="ts" setup>
import { ShortCuts } from '@renderer/core/shortcut'
import { ref, watch } from 'vue'
import { Settings } from '@renderer/core/settings'

const { short, msg } = defineProps<{
  msg: string
  short: ShortCuts
}>()

const data = ref(short.data)
const parsed = ref(short.parse())

watch(data, (v) => {
  short.set_data(v)
  parsed.value = short.parse()
  Settings.save()
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
    },
    { once: true }
  )
}
</script>

<template>
  <tr class="shortcut-single-line">
    <td style="width: 40%; text-align: right">{{ msg }}</td>
    <td style="width: 10%"></td>
    <td v-if="is_listen" class="shortcut-single-btn">请输入快捷键</td>
    <td v-else class="shortcut-single-btn" @click="listen_keyboard">{{ parsed }}</td>
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
.shortcut-single-btn {
  cursor: pointer;
  user-select: none;
  background-color: #00000066;
  width: 8rem;
}
</style>
