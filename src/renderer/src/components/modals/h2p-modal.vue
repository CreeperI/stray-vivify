<script lang="ts" setup>
import { ref } from 'vue'
import SimpleModal from '@renderer/components/modals/simple-modal.vue'

const H2P_ARTICLES: { id: number; title: string }[] = [
  { id: 1, title: '导读' }
]

/** 当前显示的文章 id */
const id = ref(1)
/** 正文滚动容器：换文章之后回到顶部 */
const body = ref<HTMLElement | null>(null)

function show(next: number) {
  if (id.value === next) return
  id.value = next
  body.value?.scrollTo({ top: 0 })
}
</script>

<template>
  <SimpleModal size="4" title="How to Play">
    <div class="h2p">
      <nav class="h2p-nav">
        <div class="h2p-nav-title">但这不是搜索框（憋笑</div>
        <div
          v-for="a in H2P_ARTICLES"
          :key="a.id"
          :class="id === a.id ? 'h2p-nav-item chosen' : 'h2p-nav-item'"
          @click="show(a.id)"
        >
          <span class="h2p-nav-id">{{ a.id }}</span>
          <span class="h2p-nav-text">{{ a.title }}</span>
        </div>
      </nav>

      <!-- 右：正文，一篇一个 div -->
      <div ref="body" class="h2p-body">
        <div v-if="id === 1" class="h2p-article">
          <h2 class="h2p-title">导读</h2>
          <p>这是一个操作说明。我不知道写什么在这里。所以就这样吧。</p>
        </div>
      </div>
    </div>
  </SimpleModal>
</template>

<style scoped>
/* 分栏：左右各自滚动，正文那一侧允许选中文字（全局是 user-select: none） */
.h2p {
  display: flex;
  width: 100%;
  min-width: 0;
  height: 60vh;
}

.h2p-nav {
  flex: 0 0 12rem;
  min-width: 0;
  overflow-y: auto;
  border-right: 2px solid rgba(184, 220, 238, 0.35);
  padding-right: 0.75rem;
}

.h2p-nav-title {
  opacity: 0.6;
  font-size: 0.8rem;
  padding-left: 0.5rem;
  margin-bottom: 0.5rem;
}

.h2p-nav-item {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.h2p-nav-item:hover {
  background: rgba(184, 220, 238, 0.15);
}

.h2p-nav-item.chosen {
  background: rgba(184, 220, 238, 0.22);
  box-shadow: inset 3px 0 0 #b8dcee;
}

.h2p-nav-id {
  flex: 0 0 1.2em;
  text-align: right;
  font-size: 0.8rem;
  opacity: 0.6;
}

.h2p-nav-text {
  text-align: left;
  min-width: 0;
  word-break: break-word;
}

.h2p-body {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-left: 1rem;
  user-select: text;
}

.h2p-article {
  text-align: left;
  line-height: 1.6;
  padding-right: 0.5rem;
}

.h2p-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0 0 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid rgba(184, 220, 238, 0.35);
}

.h2p-article h3 {
  font-size: 1rem;
  font-weight: 500;
  margin: 1.1rem 0 0.35rem;
}

.h2p-article p {
  margin: 0.35rem 0;
}

.h2p-article ul {
  margin: 0.35rem 0;
  padding-left: 1.3rem;
}

.h2p-article li {
  margin: 0.15rem 0;
}

.h2p-article code {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.2rem;
  padding: 0 0.3rem;
  font-size: 0.9em;
}

.h2p-article kbd {
  display: inline-block;
  padding: 0 0.35em;
  border: 1px solid rgba(184, 220, 238, 0.5);
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.3);
  font-family: monospace;
  font-size: 0.85em;
  line-height: 1.4;
}

/* 需要单独强调的一段话 */
.h2p-note {
  background: rgba(255, 215, 0, 0.08);
  border-left: 3px solid #ffd700;
  border-radius: 0 0.25rem 0.25rem 0;
  padding: 0.35rem 0.6rem;
  opacity: 0.95;
}
</style>
