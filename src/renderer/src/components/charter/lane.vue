<script setup lang="ts">
/**
 * 0: 0px
 * 1: 131 + 6
 * 2: 131*2 + 6*2
 * 3: 131*3 + 6*3
 * 4: 131*4 + 6*4
 * */

</script>

<template>
  <div class="lane-wrapper">
    <div class="lane-line" style="background-color:#ffffff;left: 0"/>
    <div class="lane-line" style="background-color:#003b63;left: 137px"/>
    <div class="lane-line" style="background-color:#45337c;left: 274px"/>
    <div class="lane-line" style="background-color:#60003a;left: 411px"/>
    <div class="lane-line" style="background-color:#ffffff;left: 548px"/>
    <div class="lane-bg" style="background-color:#001523;left: 5px;"/>
    <div class="lane-bg" style="background-color:#270017;left: 279px;"/>

  </div>
</template>

<style scoped>
.lane-wrapper {
  width: 620px;
  height: 100%;
  position: relative;
  padding: 0;
  margin: 0;
  overflow: hidden;
}
.lane-line {
  width: 6px;
  height: 100%;
  border: 0;
  padding: 0;
  margin: 0;
  z-index: 1;
  position: absolute;
  top: 0;
}
.lane-bg {
  width: 271px;
  height: 100%;
  z-index: 0;
  position: absolute;
  top: 0;
}
.lane-bar-line {
  background-image: linear-gradient(to bottom, #ffffff 4px, transparent 4px);
}
</style>
