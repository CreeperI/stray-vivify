<script setup lang="ts">
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import FullNotes from '@renderer/components/chart-v2/full-notes.vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Chart } from '@renderer/core/chart/chart'

function write_png() {
  Chart.current?.write_png()
}
</script>

<template>
  <SimpleModal size="lg">
    <div class="chart-preview-wrapper">
      <div class="chart-preview-top">
        <a-button2 msg="导出为png" @click="write_png" />
      </div>
      <div class="chart-preview-svg">
        <div>
          <full-notes />
        </div>
      </div>
    </div>
  </SimpleModal>
</template>

<style scoped>
.chart-preview-wrapper {
  height: 60vh;
  width: 100%;
}
.chart-preview-top {
  line-height: 3rem;
  border-bottom: 3px solid #b8dcee;
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
  padding-bottom: 5px;
}
.chart-preview-svg {
  max-height: calc(100% - 3rem - 30px);
  overflow: scroll;
}
</style>
