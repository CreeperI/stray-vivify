<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { Chart } from '@renderer/core/chart/chart'
import { ref } from 'vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'

const backups = ref<string[]>([])
const chart = Chart.$current

function load_backup(name: string) {
  chart.load_backup(name)
}
chart.get_backup_list().then((v) => (backups.value = v))
</script>

<template>
  <simple-modal size="2">
    <template #header>Load Backup</template>
    <div v-if="backups.length" class="backup-contain">
      <template v-for="i in backups">
        <div>{{ i }}</div>
        <a-button2 msg="加载" @click="load_backup(i)" />
      </template>
    </div>
  </simple-modal>
</template>

<style scoped>
.backup-contain {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 5px;
}
</style>
