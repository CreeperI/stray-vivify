<script setup lang="ts">

import {modal} from "@renderer/core/modal";
import {watch} from "vue";
const current = modal.current_ref
watch(current, (v) => console.log(v))
</script>

<template>
  <teleport to="body">
    <component :is="modal.current?.component" v-if="current"/>
  </teleport>
</template>

<style scoped>

</style>
