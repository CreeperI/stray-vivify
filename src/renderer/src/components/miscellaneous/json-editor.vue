<script lang="ts" setup>
import { json_editor } from '@renderer/core/misc/json-editor'

const modal = defineModel()
const options = withDefaults(defineProps<{ editable: boolean }>(), { editable: false })

const comp = json_editor(modal, options)
</script>

<template>
  <component :is="comp" />
</template>

<style scoped>
.json-tree-editor {
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  padding: 12px;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  background-color: #fff;
  user-select: text;
}

.json-line {
  display: flex;
  align-items: center;
  padding: 2px 0;
  cursor: default;
}

.json-line--expandable {
  cursor: pointer;
}

.json-line--expandable:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.json-line--root {
  /* 根节点无特殊样式，但可通过此 class 覆盖 */
  background: transparent;
}

.json-toggle {
  cursor: pointer;
  user-select: none;
  display: inline-block;
  width: 16px;
  color: #999;
  margin-right: 4px;
  text-align: center;
}

.json-toggle-placeholder {
  display: inline-block;
  width: 16px;
}

.json-indent {
  display: inline-block;
  height: 1px;
  /* width controlled by style */
}

.json-key {
  color: #d73a49;
  margin-right: 6px;
}

.json-bracket {
  color: #24292e;
}

.json-value-string {
  color: #690; /* green */
}

.json-value-number {
  color: #1a73e8; /* blue */
}

.json-value-boolean {
  color: #d73a49; /* red */
}

.json-value-null {
  color: #7986cb; /* purple */
}

.json-value-other {
  color: #24292e;
}

.json-value-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #b8dcee;
  font-family: inherit;
  font-size: 13px;
  padding: 1px 2px;
  outline: none;
  width: 100px;
  color: inherit;
}

.json-value-input:focus {
  border-bottom-color: #0366d6;
}

/* 右键菜单提示（可选） */
.json-line[oncontextmenu] {
  position: relative;
}
</style>
