<script setup lang="ts">

import AHref from '@renderer/components/a-elements/a-href.vue'
</script>

<template>
  <div class="credits-list">
    <div class="credits-head">
      Creator
    </div>
    <div class="credits-col">
      <a-href href="https://space.bilibili.com/517691213">TerminalFlow</a-href>
      <a-href href="https://space.bilibili.com/517691213">Allesta</a-href>
      <a-href href="https://space.bilibili.com/517691213">Ts. Final</a-href>
      <a-href href="https://space.bilibili.com/517691213">Terminal Society Inc.</a-href>
      <a-href href="https://space.bilibili.com/517691213">CharaX</a-href>
    </div>
    <div class="credits-head">
      Pilot Assistants/Contributors
    </div>
    <div class="credits-3col">
      <span>chichiga</span>
      <span>Fyato</span>
      <span>GouYu</span>
      <span>Hileznx</span>
      <span>Kirαri</span>
      <span>zhangjunyuan</span>
      <span>QWQTATQWQTAT</span>
      <span>星茄</span>
      <span>玄天空翼</span>
      <span>yzuio</span>
      <span>1sk3se</span>
      <span>2569083408</span>
      <span>૮ ・ﻌ・ა</span>
    </div>
    <div class="credits-head">
      Special Thanks
    </div>
    <div class="credits-4col">
      <a-href href="https://www.electronjs.org/">Electron</a-href>
      <a-href href="https://cn.vuejs.org/">Vue</a-href>
      <a-href href="https://vitejs.cn/">Vite</a-href>
      <a-href href="https://github.com/kolirt/vue-modal">kolirt (vue-modal)</a-href>
      <a-href href="https://vite.electron.js.cn/">Electron-Vite</a-href>
      <s>
        <a-href href="https://arcwiki.mcd.blue/">Arcaea中文维基</a-href>
      </s>
      <a-href href="https://wiki.rotaeno.cn/">Rotaeno中文维基</a-href>
    </div>
  </div>
</template>

<style scoped>
a {
  color: #b8dcee;
}
a:visited {
  color: #b8dcee;
}
.credits-list {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.credits-list > div {
  width: 100%;
}
.credits-head {
  width: 100%;
  text-align: center;
  margin-bottom: 10px;
  font-size: 1.5rem;
  text-shadow: #16ccae 2px 2px;
  font-weight: bolder;
}
.credits-head:not(:first-child) {
  margin-top: 50px;
}

.credits-2col {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  * {
    flex-basis: 50%;
  }
}
.credits-3col {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  * {
    flex-basis: 33%;
  }
}
.credits-4col {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  * {
    flex-basis: 25%;
  }
}
.credits-col {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  justify-content: center;
  * {
    flex-basis: 100%;
    text-align: center;
  }
}
* {
  user-select: none;
  text-align: center;
  font-size: 1.1rem;
}
</style>
