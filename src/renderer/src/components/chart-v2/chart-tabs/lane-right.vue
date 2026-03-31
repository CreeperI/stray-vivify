<script lang="ts" setup>
import FnEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-editor.vue'
import FnTime from '@renderer/components/chart-v2/chart-tabs/small/fn-time.vue'
import FnDebug from '@renderer/components/chart-v2/chart-tabs/small/fn-debug.vue'
import FnEditTools from '@renderer/components/chart-v2/chart-tabs/small/fn-edit-tools.vue'
</script>

<template>
  <div class="fn-wrapper">
    <fn-editor />
    <fn-time />
    <fn-edit-tools />
    <fn-debug />
  </div>
</template>

<style scoped>
.table-set {
  height: min-content;
}

input {
  width: 100%;
}

td {
  text-align: center;
}

.fn-right-inner>input {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
  border-bottom: 1px solid transparent;
}

.fn-right-inner>input:focus {
  border-bottom: 1px solid var(--grey);
}
</style>
