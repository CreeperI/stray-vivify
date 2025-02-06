<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { closeModal, confirmModal } from '@kolirt/vue-modal'
import AButton from '@renderer/components/a-elements/a-button.vue'

const { msg } = defineProps<{
  msg: string
}>()
</script>

<template>
  <SimpleModal size="m" :show-close="false">
    {{ msg }}
    <template #footer>
      <button class="btn btn-primary" @click="confirmModal()">确定</button>
      <a-button msg="!" @click="confirmModal()" />
      <a-button class="btn btn-secondary" msg="!!" @click="closeModal()" />
    </template>
  </SimpleModal>
</template>

<style scoped></style>
