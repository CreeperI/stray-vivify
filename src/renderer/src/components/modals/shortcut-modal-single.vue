<script setup lang="ts">
import { ShortCuts } from '@renderer/core/shortcut'
import ALabel from '@renderer/components/a-elements/a-label.vue'
import { ref, watchEffect } from 'vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'

const { short, msg } = defineProps<{
  msg: string
  short: ShortCuts
}>()

const data = ref(short.data)
watchEffect(() => short.set_data(data.value))
</script>

<template>
  <tr class="shortcut-single-line">
    <td>{{ msg }}</td>
    <td>
      <a-text-input v-model="data.key" />
    </td>
    <td>
      <a-label label="ctrl">
        <a-checkbox v-model="data.ctrl" />
      </a-label>
    </td>
    <td>
      <a-label label="alt">
        <a-checkbox v-model="data.alt" />
      </a-label>
    </td>
    <td>
      <a-label label="shift">
        <a-checkbox v-model="data.shift" />
      </a-label>
    </td>
    <td></td>
  </tr>
</template>

<style scoped>
input[type='text'] {
  width: 7ch;
}
</style>
