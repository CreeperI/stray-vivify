import { Invoke } from '@renderer/core/ipc'
import { External } from '@preload/external'

export const StartUpTips: string[] = [
  'also try vivid/otto!',
  '这么强？？？',
  'a-text: v-model=f**ker',
  '回滚到pre5——',
  'stray/vivify v2欢迎你！',
  '今天改了多少bug。不知道，多出来很多……',
  '早上是晚上的第二天，晚上是早上。',
  'A.R.K载体。可惜的是……',
  '今天回家！明天不回！',
  'npm run dev',
  '[vite] connection lost...',
  '[vue warn] Shit chart detected',
  '我草卡输入法了',
  'Felleta::stray-vivify',
  'int mian() {}',
  '#include &lt;stray.h&gt;',
  'No detours, no detours',
  'FPS: N/A',
  'chart.diff.fuck_shown()',
  'ultradash > J S > >',
  '卡 车 丢 失',
  'also try Rotaeno!',
  "不是，我很好奇到底为什么会写这个。这不就纯纯私货大杂烩吗，那我更新这个list的意义何在？我说原神牛B，但是我不玩原神（其实55级了）；我说明日方舟是区，但是还是高高兴兴地给小马宝莉爆了24块钱和3*18个源石。我提笔（？）写下这一段文字，却发现自己钱包空空，坐在电脑前两眼无神地看着sv的源代码然后感到“我草我写的什么东西”。这是开发者必备的一环吗？我不知道。你可以点击上方sv图标来刷新tips如果这个实在太长挡住了你的视线，但是如果你没有开sv图标显示你就不能刷掉因为我没有粘贴一个v-on到div.su-title上面（转手就去加上了因为小孩害怕被人挂了，你这不是纯有病吗），不喜欢这个图标的人我确实不能拿你怎么样但是它会老老实实吃掉你95.27kB的内存而且如果我没记错沟槽的electron-builder会把这个东西打包两次所以你会被吃掉95.27x2=_____kB的存储空间。你可以删掉它但是我不高兴了，我会往你的sv里面植入病毒然后拿你的电脑内存开一个Gray:Heaven服务器，盗走你电脑上所有的百合图片让你晚上对着只余滚木的图片文件夹大哭大闹，然后自动在你的电脑上下载明日方舟（终末地不熟，垃圾游戏）（这一句话纯属我真不喜欢这个游戏，你可以喜欢终末地但不要试图劝说我要喜欢终末地，如果你不喜欢敬请点击上面的图标刷新tips）PC端并自动启动获得11.45秒的生存时间。我一直好奇会认真看这个tips的人都是什么成分，玩蔚蓝吗（怎么有张雪峰照片）（句读之不知）？其实我是个弱弱萌新1A都要死一百次，2A至今还是只能靠assist才能通过。加拿大病毒不会感染我因为我压根学不会凌波微步所以我不想玩蔚蓝（羡慕手法大佬）。至于隔壁1999，别问了我现在只会露西+苏芙比剩下随便放一个人然后就干等露西开出大来，对单我直接死。我肯定不擅长玩音游，也没有特别大的热情玩音游，你看我玩了5年阿卡伊但是只有12.4，现在不过是甲亢reg4的水平。为什么要打音游？闲得慌？倒不如拿起我的中二手台开一把狂End Time然后睡大觉，我说rin是神（以及推荐循幻空的手台，还是做的不错的，如果你没钱买抬手乐）。梦见哪句写哪句，我真的不想做sv更新了因为我知道每次更新一边修bug然后就会蹦出新的bug所以我还是会被骂至于莫名其妙的白屏我真的不知道electron抽什么风我也很难解决所以我推荐出现诸如此类滚木提示大问题影响到你正常写噗的话请联系我看看F12然后我已急哭地去看这又是哪里溢出了导致vue罢工或者因为这个字符串太长导致你的sv爆掉了但是这个和图片比起来难道不是图片才是区吗因为你看一个文件用掉了一万MB的内存但是这个字符串什么都不会用掉只会在你的Memory.String里面肆无忌惮地拉史不管你看不看这个tip都是一样的因为这是全量编译加载的什么你问我能不能不要这么做那我只能说你也不想让你的sv拥有一个比命长的启动进度条吧所以我能怎么办呢（笑）。"
]

export async function load_external_tips() {
  const r = await Invoke('read-external', { fname: 'startup-tips.json' })
  if (!r) {
    console.log('Read External: startup-tips failed')
    return
  }
  StartUpTips.push(...(JSON.parse(r) as External.StartUpTips))
  console.log('Read External: startup-tips')
}
