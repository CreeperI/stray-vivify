<script setup lang="ts">
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { AntiAddiction } from '@renderer/core/misc/anti-addiction'
import { closeModal } from '@kolirt/vue-modal'

const msg = defineProps<{ msg: string[] }>()
function close_and_disable() {
  AntiAddiction.disable = true
  closeModal()
}
</script>

<template>
  <simple-modal size="2">
    {{ msg[0] }}
    <br>
    {{ msg[1]}}
    <template #footer>
      <a-button2 msg="本次启动关闭" @click="close_and_disable" />
      <a-button2 msg="ok" @click="$emit('close')" />
    </template>
  </simple-modal>
</template>

<style scoped></style>
