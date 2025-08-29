<script lang="ts" setup>
defineProps<{
  build: number | string
  y: string | number
  m: string | number
  d: string | number
}>()

function toDate(y: string | number, m: string | number, d: string | number) {
  if (typeof y == 'string') y = parseInt(y)
  if (typeof m == 'string') m = parseInt(m)
  if (typeof d == 'string') d = parseInt(d)
  return new Date(y, m, d).toLocaleDateString()
}
</script>

<template>
  <div class="builds">
    <div class="build-title">
      Build {{ build }}
      <span class="build-date">
        {{ toDate(y, m, d) }}
      </span>
      <span v-if="$slots.header" class="build-name">
        <slot name="header"></slot>
      </span>
    </div>
    <div v-if="$slots.bugs" class="build-content pointed-list">
      <div class="build-content-title">Bug修复</div>
      <slot name="bugs"></slot>
    </div>
    <div v-if="$slots.bugs" class="build-content pointed-list">
      <div class="build-content-title">优化</div>
      <slot name="qol"></slot>
    </div>
    <div v-if="$slots.default" class="build-content pointed-list">
      <div class="build-content-title">更新内容</div>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
* {
  user-select: none;
  word-break: break-all;
}

.builds {
  display: flex;
  flex-direction: column;
  padding-left: 15px;
  position: relative;
  padding-bottom: 10px;
  margin-bottom: 10px;
  margin-top: 5px;
  border-bottom: 1px solid #b8dcee;
}

.builds > div {
  text-align: left;
  padding-right: 10px;
}

.build-title {
  font-size: 1.5rem;
  text-align: center;
}

.build-date {
  font-size: 0.9rem;
}

.build-name {
  font-size: 1.3rem;
  text-align: center;
  margin-left: 25px;
  font-weight: bold;
}

.build-content {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  padding-left: 10px;
}

.build-content-title {
  font-size: 1.25rem;
  text-align: left;
  position: relative;
  left: 0;
  margin-bottom: 10px;
}
</style>
<style>
.build-content > span {
  display: block;
  font-size: 0.95rem;
  margin-left: 5px;
}
.pointed-list > div:not(.build-content-title)::before {
  content: '•';
  position: relative;
  left: 0;
  width: 10px;
  display: inline-block;
}
.pointed-list > :not(div) {
  margin-left: 10px;
}
.build-content > div {
  margin-bottom: 5px;
}
</style>
