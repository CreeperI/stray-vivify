<script setup lang="ts">

import {modal} from "@renderer/core/modal";
import {onMounted, onUnmounted, Ref, ref} from "vue";

const props = defineProps<{ hide_close?: boolean }>()
// hide_close is set to false by default here
const hide = props.hide_close
const el: Ref<HTMLDivElement | null> = ref(null)
const posAttr: Ref<{ left?: string, top?: string }> = ref({})
let timeOutId: number;
onMounted(() => {
  let x = setInterval(() => {
    if (!el.value) {
      return
    }
    const h = el.value.offsetHeight, w = el.value.offsetWidth
    posAttr.value = {
      left: (window.innerWidth - w) / 2 + "px",
      top: (window.innerHeight - h) / 2 + "px"
    }
  }, 30)
  timeOutId = Number(x)
})
onUnmounted(() => {
  clearInterval(timeOutId)
})
</script>

<template>
  <div class="modal-wrapper" :style="posAttr" ref="el">
    <div class="modal-header" v-if="$slots.header">
      <slot name="header"/>
    </div>
    <div v-if="!hide" class="modal-close" @click="modal.hide()">&times;</div>
    <div class="modal-content">
      <slot/>
    </div>
  </div>
</template>

<style scoped>
.modal-wrapper {
  position: absolute;
  min-width: 15vw;
  max-width: 60vw;
  max-height: 80vh;
  transform: translateY(-50px);
  background-image: var(--common-bgi);
  border: 2px #b8dcee solid;
  z-index: 10;
  box-shadow: #00000088 0 0 50px 50px;
}

.modal-header {
  height: 2rem;
  width: 100%;
  text-align: center;
  font-size: 1.7rem;
  line-height: 2rem;
  padding-top: 0.5rem;
}

.modal-content {
  height: 90%;
  box-sizing: border-box;
  width: 100%;
  padding: 10px;
}


.modal-close {
  position: absolute;
  right: 15px;
  top: 15px;
  height: 1.2rem;
  width: 1.2rem;

  line-height: 50%;
  font-size: 1.3rem;
  text-align: center;
  padding-top: 0;

  border: 2px solid #b8dcee;
  color: #b8dcee;
  background-color: black;
  box-sizing: border-box;
  transition: all 0.2s linear;
  cursor: pointer;
}

.modal-close:hover {
  color: black;
  background-color: #b8dcee;
}
</style>
