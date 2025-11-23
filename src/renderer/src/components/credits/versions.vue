<script lang="ts" setup>
import Build from '@renderer/components/credits/build.vue'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
</script>

<template>
  <div class="version-wrapper">
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
        <div>添加了本界面。</div>
        <div>现在界面轨道位置可以调整了。请在设置中查看选项。</div>
        <span
          >是按照界面大小（1600px）来自动转换的。不建议使用中间停靠的策略，这样子在窗口很窄的时候会视觉上出问题。</span
        >
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
    <Build build="4" d="8" m="3" y="2025">
      <template #bugs>
        <div>修复了撞尾bug。</div>
      </template>
      <template #header> stray/vivify </template>
      <div>新增了纯享模式。该模式下，你可以撇掉别的乱七八糟的东西。</div>
      <div>
        增加了撤销、重做功能。快捷键为Ctrl+Z和Ctrl+Y，这方面（指快捷键）的自定义还在路上（悲
      </div>
      <div>重写了部分底层逻辑，修改了小节线的显示方式，添加了小节数显示。</div>
      <div>优化了轨道在左侧时的功能选项的显示方式。</div>
      <div>新增了Credits。请在设置中打开！</div>
      <div>
        移除了note重叠的检测，现在只不允许放在同一个位置（这意味着你大概可以把单键放在hold里面……
      </div>
      <div>为制谱器起了个名字。</div>
    </Build>
    <Build build="5" d="3" m="4" y="2025">
      <template #bugs>
        <div>修复了（？）关于谱面offset的一系列问题。现在应该好了吧……</div>
      </template>
      <template #qol>
        <div>
          现在将谱面渲染逻辑改为分组渲染。drawCanvas（画小节的）效率现在应该提高了2900%（人话：消耗时间从大概58ms->2ms）
        </div>
        <div>修改了offset的逻辑。现在应该和音频时间分开独立计算。</div>
        <span>然而我不知道为什么之前会把这俩玩意混在一起</span>
        <div>将bpm列表改为懒加载。这可能提升一部分性能。</div>
      </template>
      <div>新增了waiting-load界面，现在如果读取的时候卡住了可以帮你分析（？）原因。</div>
      <div>新增了株洲岛有栖。</div>
      <template #header> 我愚人节呢？？？ </template>
    </Build>
    <Build build="7.3" d="17" m="8" y="2025">
      <template #header> stray-vivify Reborn </template>
      <div>移除了waiting-load</div>
      <div>移除了株洲岛有栖，新增了株洲岛有栖（汉堡ver）画师：River</div>
      <div>修改了lane的渲染方式。从canvas切换到了svg。</div>
      <div>移除了纯享模式，改为了预览模式，从工具栏进入。按空格以开始。</div>
      <div>修改了快捷键、设置界面</div>
      <div>新增了F1界面。点击试试吧！</div>
      <div>增加了skin。</div>
      <div>调整了很多界面。</div>
    </Build>
    <Build build="8" d="24" m="8" y="2025">
      <template #header> stray-vivify 101.00% </template>
      <div>Major 新增游玩模式</div>
      <div>解除了不能下宽面（？）的限制。</div>
      <div>修改F1界面为Inspector.快捷键可以在设置中修改。</div>
    </Build>
    <Build build="8.2" d="29" m="8" y="2025">
      <template #header> 开学快乐……？ </template>
      <template #bugs>
        <div>修复了预览模式暴毙的bug，原因是我把退出的逻辑写到空格上了</div>
      </template>
      <div>修改了宽面的皮肤读取逻辑</div>
    </Build>
    <Build build="8.3" d="30" m="8" y="2025">
      <template #bugs>
        <div>回滚了宽面和渲染逻辑。由于img的鼠标操作比较猎奇，所以后面再说吧</div>
        <div>修复了validator的bug，这会导致所有面变成米。</div>
      </template>
      <div>新增了一个导出选项。后面计划把所有导入导出都塞到这个里面，虽然不太方便（？</div>
    </Build>
    <Build build="8.4" d="31" m="8" y="2025">
      <template #bugs>
        <div>#5 3.0流速下大概会相较鼠标偏后1个16分音</div>
        <div>#10 修改了2宽bumper的lane摆放逻辑，现在是|-1.5-|-1-|-1.5-|的权重。</div>
        <div>再次修复了validator的bug，这会导致所有1宽的东西全变成普通chip</div>
        <div>修复了本界面日期多一个月的bug。</div>
      </template>
      <template #qol>
        <div>#8 0面改米</div>
        <div>#9 为note添加了z-index来处理遮挡关系，现在是chip在ln上面，其次宽在下。</div>
        <div>长条上面的贴图可以改了。</div>
        <div>将所有导入导出都放到了一个modal中。</div>
      </template>
      <div>添加了word-helper机制，用来做一些小提示。</div>
      <div>现在在切换版本的时候会弹出来本页面。</div>
      <div>密度（梯度）折线图</div>
      <div>移除了ab30，广告位招租（？</div>
    </Build>
    <Build build="8.5" d="1" m="9" title="V8 Stable(?" y="2025">
      <template #bugs>
        <div>修复了本页面在没有bug修复的时候不会显示qol的bug。（？？？</div>
      </template>
      <template #qol>
        <div>新增了一个检查skin缺失哪些贴图的modal。</div>
        <div>给本页面增加了高亮。</div>
      </template>
      <div>添加了word-helper</div>
    </Build>
    <Build build="8.9" d="20" m="9" title="Pre 9" y="2025">
      <template #qol>
        <div>
          仿osu的小节线渲染。但是不知道为什么这个颜色总是不对，但是我的<WordHelper
            dec="物竞委你们最好晚上睁着眼睡觉"
            msg="脑子有点过载"
          />无法处理这个问题。后面再说
        </div>
        <div>比osu略微高级一点的移动所有物件的选项。下面的移动全部会覆盖上面的移动此timing。</div>
        <div>给谱面列表添加了曲绘显示。</div>
        <div>给header添加了所处页面的高亮提示。</div>
      </template>
      <template #bugs>
        <div>修复了vsc导出中1宽全部都会导出为chip的bug。</div>
      </template>
      <div>
        新增了导入osz的东西，调整了<word-helper
          dec="谱 面 列 表"
          msg="chart-list"
        />页面中的导入按钮
      </div>
      <div>调整了Inspector页面中对缺失图片的分类逻辑。现在是单独一面的了。</div>
      <div style="font-size: 2rem; font-weight: bold">
        <word-helper dec="我草我们pre5真王朝了" msg="Pre5还在追我！" />
      </div>
      <div>塞了一些sv的史在里面</div>
      <div>
        osz导入中由于osu存储timing的方式比较伪人（指存储时长），所以导入的timing的bpm会比较奇怪。
      </div>
    </Build>
    <Build build="9" d="24" m="9" title="Build ⑨" y="2025">
      <template #qol>
        <div>添加了select功能，以及配套的快捷键。</div>
        <div>添加了打击音。由于html特色延迟，打击音大概率是不准的，请谨慎使用</div>
        <div>在Inspector中新增了（运行）内存占用管理。</div>
        <div>给输入id的界面添加了enter确认。</div>
      </template>
      <template #bugs>
        <div>修复timing无法滚动的问题</div>
        <div>略修改了validator的逻辑。</div>
      </template>
      <div>添加了svg导出。要求谱面至少有1个物件。会很卡的。</div>
      <div>调整了导入osz的界面。</div>
      <div>调整了CORS policy</div>
      <div>给变速打了个底。</div>
      <div>移除了部分不需要的东西（指node库）</div>
      <div>调整了小节线的上色逻辑。现在应该比较人类了。</div>
      <div><s>神秘东方小妖精正在入侵sv。</s></div>
    </Build>
    <Build build="9.1" d="6" m="9" title="Build 9s" y="2025">
      <template #qol>
        <div>添加了diff复制的功能。（指复制一整个diff）</div>
        <div>为导出谱面预览png添加了显示部分内容的选项。</div>
        <div>修改了打击音的导入逻辑，现在不要求打击音的后缀了。</div>
        <div>在谱面统计中调整了总数的计算方式，添加了bpm的统计</div>
      </template>
      <div>为Inspector添加了一个占用磁盘空间的统计。</div>
      <div>添加了用户名设置（然并卵）</div>
      <div>添加了vsc导入，调整了导入导出界面的排版。</div>
      <div>@-Re-Again- 添加了拍号的选项。可以在设置中修改，注意和小节数只能选一个。</div>
      <div>大概修复了打击音延迟比较大的问题，切换到了HTML的AudioContext。</div>
      <div>@-Re-Again- 添加了导入vsc的功能。</div>
      <div>限制了<word-helper dec="是我哦。" msg="Word Helper" />的大小。</div>
      <template #bugs>
        <div>修复了osz导入会出现负数bpm的bug。</div>
        <div>调整了曲目信息页面的信息不同步的bug。</div>
        <div style="font-size: 2rem">
          <word-helper
            dec="我说怎么sv包体积这么鬼大原来是"
            msg="修复了打包应用时错误的把我写的谱塞到应用包里面的bug。"
          ></word-helper>
        </div>
      </template>
    </Build>
    <Build build="9.2" y="2025" m="10" d="6">
      <template #bugs>
        <div>修改了导入曲目的bug</div>
      </template>
      <div>添加了打击音音量</div>
      <div>custom song导出</div>
      <div>回退了diff的编辑逻辑</div>
    </Build>
    <Build build="9.3" y="2025" m="10" d="18" title="9s2">
      <template #bugs>
        <div>非全屏状态下，note定位错误的问题</div>
        <div>窗口大小不及时同步的问题，现在采用的是每秒更新一次</div>
        <div>修复拉面会被select卡掉的问题</div>
        <div>修复select在摆放note时仍然会触发的问题</div>
      </template>
      <div>Inspector添加了Frame Rate - Update Rate</div>
      <div>调整了部分程序结构</div>
    </Build>
    <Build build="9.4" y="2025" m="11" d="23" title="Pre 10">
      <div>更改了bpm修改时同步计算的逻辑。</div>
      <div>添加了Custom Song导出</div>
      <div>将note插入 删除逻辑改为二分法</div>
      <div>添加了节奏谱选项，在预览模式中可用</div>
      <div>添加了未完成的SV页面。</div>
    </Build>
  </div>
</template>

<style scoped>
.version-wrapper {
  display: flex;
  flex-direction: column-reverse;
}
</style>
