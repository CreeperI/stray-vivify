<script lang="ts" setup>
import Header from '@renderer/components/header.vue'
import Charter from "@renderer/components/charter/charter.vue";
import ui from "@renderer/core/ui";
const {state} = ui
</script>

<template>
  <Header/>
  <Charter v-if="state == 'charting'" />
  <div id="n-c" class="notify-container"/>

</template>

<style scoped>
.notify-container {
  position: absolute;
  margin: 10px;
  background: #fff;
  z-index: 2;
  height: 20px;
  right: 0;
  top: var(--height-header);
}

.notify-container > div {
  max-width: 350px;
  padding: 0 5px;
}

.notify-box {
  max-width: 300px;
  margin-top: 0.2rem;
  padding: 0.5rem 1.5rem;
  animation-fill-mode: both;
  border: 2px solid;

}

.notify-normal {
  background-color: #b8dcee;
  color: #000000;
  border-color: #16ccae;
}

.notify-error {
  background-color: #943430;
  color: #b8dcee;
  border-color: #b60000;
}

.notify-success {
  background-color: #f7f12c;
  color: #000000;
  border-color: #bbb516;
}

.notify-a-enter {
  animation: notify-enter 0.3s ease-in;

}

@keyframes notify-enter {
  0% {
    transform: translateX(125%)
  }
  50% {
    transform: translateX(2rem)
  }
  75% {
    transform: translateX(-1rem)
  }
  100% {
    transform: translateX(0)
  }
}

.notify-a-leave {
  animation: notify-leave 0.3s ease-out;
}

@keyframes notify-leave {
  0% {
    transform: translateX(0)
  }
  50% {
    transform: translateX(-1rem)
  }
  75% {
    transform: translateX(2rem)
  }
  100% {
    transform: translateX(125%);
  }
}
</style>

<style>
:root, body {
  background-image: linear-gradient(220.55deg, #34495d 0%, #0E2C5E 100%);
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  --common-bgi: linear-gradient(60deg, #0d1418 0%, #11161b 100%);
  --height-header: 3rem
}

* {
  color: #b8dcee
}

#app {
  height: 100%;
  width: 100%;
}
</style>
