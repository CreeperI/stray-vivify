<script lang="ts" setup>
import Build from '@renderer/components/credits/build.vue'
</script>

<template>
  <div>
    <Build build="1" d="31" m="1" y="2025">
      <div>第一个测试版本。</div>
    </Build>
    <Build build="2" d="1" m="2" y="2025">
      <template #bugs>
        <div>修复了note图片缺失的问题。（来自Fyato）</div>
        <span>
          此问题来源于vue的动态引用资源的路径问题。
          由于在写谱的时候传给负责渲染note模块的数据是动态的，所以引用图片的时候使用了基于/public的动态路径。
          正常来说，对于css中的url，img的src等对文件的url引用会在编译的时候自动替换为相对根目录的相对路径。
          但是对于动态的引用资源，则不会有这一步编译，则原来的文件路径就会被保留。
          （如果正常做前端项目并不会有什么问题，因为根目录是相同的，即"/"）
          但是在这里（本项目中），基于electron-vite的项目根目录是在/，但是渲染端的目录在/src/renderer/
          在调试（开发dev）的时候，electron会以后者作为渲染端的根目录，所以可以找到/public文件夹，
          但是打包（build:win）的时候，所有东西都会砸到根目录下，也即没有了/src/renderer/public文件夹，
          但是在动态引用中，会自动解析（这不是神金吗。）为这个虚空目录，自然找不到了。
          如果你打开控制台可以看到，引用这个图片的时候采用的路径是C:/note.png。（盘符可能不一样，无关紧要啦）
          因此修改了动态引用的路径。
          <br />
          原本是
          <code>img src="/note.png"</code>， 更新后则使用了
          <code>img src="./note.png"</code>。这样就没问题了。（倒，这玩意是最逆天的一个了）
        </span>
      </template>
    </Build>
    <Build build="3" d="5" m="2" y="2025">
      <template>
        <div>
          添加了本界面。
        </div>
        <div>
          现在界面轨道位置可以调整了。请在设置中查看选项。
        </div>
        <span>是按照界面大小（1600px）来自动转换的。不建议使用中间停靠的策略，这样子在窗口很窄的时候会视觉上出问题。</span>
      </template>
      <template #bugs>
        <div>修复了note摆放容易错位的问题。（来自1sk3se）</div>
        <span
          >这个bug其实很简单。在每次更新谱面时，会重新计算一次各bpm分段的长度，位置等等。
          但是notes是按照摆放时间顺序存储的，所以会出现bpm分段出现问题的情况（指先写后面再往前面放bpm）。
          解决办法：自动按时间排序。（笑，这是什么简单但难蚌bug
        </span>
      </template>
    </Build>
    <Build build="4" y="2025" m="3" d="8">
      <template #bugs>
        <div>修复了撞尾bug。</div>
      </template>
      <template #header>
        <div>- stray/vivify</div>
      </template>
        <div>新增了纯享模式。该模式下，你可以撇掉别的乱七八糟的东西。</div>
        <div>增加了撤销、重做功能。快捷键为Ctrl+Z和Ctrl+Y，这方面（指快捷键）的自定义还在路上（悲</div>
        <div>重写了部分底层逻辑，修改了小节线的显示方式，添加了小节数显示。</div>
        <div>优化了轨道在左侧时的功能选项的显示方式。</div>
        <div>新增了Credits。请在设置中打开！</div>
        <div>移除了note重叠的检测，现在只不允许放在同一个位置（这意味着你大概可以把单键放在hold里面……</div>
        <div>为制谱器起了个名字。</div>
    </Build>
    <Build build="5" y="2025" m="4" d="3">
      <template #bugs>
        <div>修复了（？）关于谱面offset的一系列问题。现在应该好了吧……</div>
      </template>
      <template #qol>
        <div>现在将谱面渲染逻辑改为分组渲染。drawCanvas（画小节的）效率现在应该提高了2900%（人话：消耗时间从大概58ms->2ms）</div>
        <div>修改了offset的逻辑。现在应该和音频时间分开独立计算。</div>
        <span>然而我不知道为什么之前会把这俩玩意混在一起</span>
        <div>将bpm列表改为懒加载。这可能提升一部分性能。</div>
      </template>
      <div>新增了waiting-load界面，现在如果读取的时候卡住了可以帮你分析（？）原因。</div>
      <div>新增了株洲岛有栖。</div>
      <template #header>
        我愚人节呢？？？
      </template>
    </Build>
  </div>
</template>

<style scoped></style>
