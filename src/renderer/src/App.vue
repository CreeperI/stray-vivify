<script lang="ts" setup>
import Header from '@renderer/components/header.vue'
import Charter from '@renderer/components/charter/charter.vue'
import PopupModal from '@renderer/components/modals/popupModal.vue'
import ui from '@renderer/core/ui'
import StartUp from '@renderer/components/startUp.vue'

const state = ui.state
</script>

<template>
  <Header />
  <StartUp v-if="state == 'startUp'" />
  <Charter v-if="state == 'charting'"/>
  <popup-modal />
  <div id="n-c" class="notify-container" />
</template>

<style>
* {
  outline: none;
}
#n-c {
  position: absolute;
  right: 5px;
  top: var(--height-header);
  z-index: 114514;
  align-items: end;
  margin-top: 10px;
}

.notify-container > div {
  max-width: 350px;
  padding: 0 15px;
  line-height: 2em;
  font-size: 1.2rem;
  margin: 5px 0;
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
    transform: translateX(125%);
  }
  50% {
    transform: translateX(2rem);
  }
  75% {
    transform: translateX(-1rem);
  }
  100% {
    transform: translateX(0);
  }
}

.notify-a-leave {
  animation: notify-leave 0.3s ease-out;
}

@keyframes notify-leave {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-1rem);
  }
  75% {
    transform: translateX(2rem);
  }
  100% {
    transform: translateX(125%);
  }
}
</style>

<style>
:root,
body {
  background-image: linear-gradient(220.55deg, #34495d 0%, #0e2c5e 100%);
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  --common-bgi: linear-gradient(60deg, #0d1418 0%, #11161b 100%);
  --height-header: 2.5rem;
  --grey: #3b4652
}

* {
  color: #b8dcee;
}

#app {
  height: 100%;
  width: 100%;
}
</style>
