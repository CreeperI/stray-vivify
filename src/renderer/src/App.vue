<script lang="ts" setup>
import Header from '@renderer/components/miscellaneous/header.vue'
import { ModalTarget } from '@kolirt/vue-modal'
import AButton from '@renderer/components/a-elements/a-button.vue'
import { Charter } from '@renderer/core/charter'
import ChartList from '@renderer/components/miscellaneous/chart-list.vue'
import ChartV2 from '@renderer/components/chart-v2/chart-v2.vue'
import { GlobalStat } from '@renderer/core/globalStat'
import { Version } from '@renderer/core/Settings'

const state = GlobalStat.route.route
</script>

<template>
  <Header v-if="state != 'editor'" />
  <ChartList v-if="state == 'start'" />
  <ChartV2 v-if="state == 'editor'" />
  <div id="n-c" class="notify-container" />
  <ModalTarget />
  <a-button
    :msg="`Version: ${Version.str}`"
    class="--build"
    @click="Charter.modal.VersionsModal.show({})"
    v-if="state != 'editor'"
  />
</template>
<style scoped>
.--build {
  position: fixed;
  right: 0;
  bottom: 0;
  border: 1px solid #b8dcee;
  background: var(--darker-bgi);
  box-shadow: none;
}
</style>

<style>
* {
  outline: none;
}

#n-c {
  position: absolute;
  right: 5px;
  top: var(--header-height);
  z-index: var(--z-highest);
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
  background-image: var(--blue-bgi);
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  height: 100%;
  width: 100vw;
  overflow: hidden;

  --darker-bgi: linear-gradient(60deg, #0d1418 0%, #11161b 100%);
  --blue-bgi: linear-gradient(220.55deg, #34495d 0%, #0e2c5e 100%);
  --purple-bgi: linear-gradient(90deg, rgba(32, 33, 70, 1) 0%, rgba(37, 49, 50, 1) 100%);
  --green-bgi: linear-gradient(220.55deg, #97E8B5 0%, #5CB67F 100%);
  --gray-bgi:linear-gradient(220.55deg, #AFCCCB 0%, #616566 100%);
  --dark-bgi: linear-gradient(1.83rad, #1E1E1ED6 0%,#1F1D1D 14%,#1F1D1D 80%,#171717D6 100%);
  --grey: #3b4652;
  --z-highest: 100;
  --h-l-b: 80px;

  --z-lane-bg: 1;
  --z-lane-line: 2;
  --z-lane-canvas: 3;
  --z-lane-bottom: 10;
  --z-lane-note: 4;
  --z-lane-note-higher: 5;

  --header-font-size: 1.2rem;
  --header-line-height: 2rem;
  --header-height: 2rem;

  --button-base: #000;
  --button-hover: #444;
}

* {
  color: #b8dcee;
}

#app {
  height: 100%;
  width: 100%;
}

code {
  line-height: 1em;
  font-size: 1rem;
}

::-webkit-scrollbar {
  display: none;
}
</style>
