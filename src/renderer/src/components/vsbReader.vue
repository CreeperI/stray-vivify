<script setup lang="ts">
import {ref} from "vue";
import type {VividStasisChart} from "@renderer/core/vsbReader/typings.ts";
import VsbParser from "@renderer/core/vsbReader/vsbParser";

const data = ref<VividStasisChart>()
const file = ref()

function onFileChange(e: Event) {
  if (!file.value) return
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const vsbParser = new VsbParser(arrayBuffer)
      data.value = vsbParser.run()
    }
    reader.readAsArrayBuffer(file)
  }
}
</script>

<template>
  <div>
    VsbReader
  </div>
  <div>
    <input type="file" @change="onFileChange" ref="file" accept="vsb">
  </div>
  <div v-if="data" class="vr-note-container">
    <div v-for="note in data.notes" :key="note.time + note.lane" class="vr-note">
      <span>{{ note.type }}</span>
      <span>{{ note.lane }}</span>
      <span>{{ note.time }}</span>
      <span>{{ note.extra }}</span>
    </div>
  </div>
</template>

<style scoped>
.vr-note-container {
  overflow-y: auto;
  max-height: 90vh;
  overflow-x: hidden;
  width: 80vw;
}

.vr-note {
  display: grid;
  grid-template-columns: repeat(4, 300px);
  text-align: left;
  width: 80vh;
}
</style>
