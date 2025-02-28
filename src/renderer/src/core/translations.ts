import settings from '@renderer/core/settings'
import { utils } from '@renderer/core/utils'
import { reactive, watch } from 'vue'

interface Translations {
  name: string
  fp: {
    charter: string
    scale: string
    meter: string
    volume: string
    note: {
      title: string
      chip: string
      bumper: string
      mine: string
      mb: string
      hold: string
      sb: string
      middle: string
    }
    chart: {
      name: string
      level: string
      choose: string
      rate: string
      create: string
      title: string
      del: string
      offset: string
    }
    song: {
      name: string
      bpm: string
      composer: string
    }
  }
  header: {
    file: {
      title: string
      open: string
      vsb: string
    }
  }
  settings: {
    language: string
    title: string
    after_reboot: string,
    layout: {
      auto: string
      middle: string
      left : string
      layout: string
    },
    reverse_scroll: string
    overlap_minimum: string
  }
  confirm: {
    vsb: string
    del_diff: string
  }
  notify: {
    move_error: string
    music_error: string
    note_error: string
  }
  start: {
    recent: string
  }
}

export const Languages = [
  'zh_cn'
  // "？？？？？"
] as const

export type Languages = (typeof Languages)[number]

export const LanguageData: { "zh_cn": Translations } & Record<Languages, Partial<Translations>> = {
  zh_cn: {
    name:"中文",
    fp: {
      scale: '缩放',
      meter: '分音',
      charter: '制谱器设置',
      volume:"音量",
      note: {
        chip: '键',
        bumper: 'Bumper',
        mine: '地雷',
        mb: '地雷Bumper',
        hold: '长条',
        sb: '判定Bumper',
        title: 'Note选择',
        middle: '允许中间的Bumper'
      },
      chart: {
        name: '谱面难度名称',
        level: '难度',
        choose: '选择难度',
        rate: '播放速度',
        create: '新增难度',
        title: '谱面设置',
        del: '删除谱面',
        offset: "偏移",
      },
      song: {
        name: '歌曲名',
        bpm: '基础BPM',
        composer: '曲师'
      }
    },
    header: {
      file: {
        title: '文件',
        open: '打开',
        vsb: '读取vsb'
      }
    },
    settings: {
      language: '语言',
      title: '设置',
      after_reboot: '（保存&重启后生效）',
      layout: {
        auto: '自动',
        middle: '居中',
        left : '左侧',
        layout: "轨道位置",
      },
      reverse_scroll: '鼠标反转',
      overlap_minimum: '物件最小间隔时间'
    },
    confirm: {
      vsb: '确定要读取vsb吗？此操作会*替换*当前谱面且不可撤销哦。',
      del_diff: '真的要删掉这个难度吗？'
    },
    notify: {
      move_error: '不能将note挪到这里哦。',
      music_error: '音频文件不存在。',
      note_error: '不能放在这里哦。'
    },
    start: {
      recent: '最近项目'
    }
  }
  /* "？？？？？": {
     fp: {
       scale: "音阶",
       meter: "米",
       charter: "谱师设置",
       note: {
         chip: "小键",
         bumper: "大键",
         mine: "炸弹",
         mb: "王炸",
         hold: "长键",
         sb: "绝赞",
         title: "截图选老婆",
         middle: "中键"
       },
       chart: {
         name: "君の名は。",
         level: "你的定级",
         bpm: "节奏每米",
         choose: "选择名字",
         rate: "打分",
         create: "机械动力",
         title :"谱面设置",
         del: "扔到垃圾桶里面"
       }
     },
     header: {
       file: {
         title: "档案",
         open: "启动",
         vsb: "搬史"
       }
     },
     settings: {
       language: "说话！",
       title: "环境",
     },
     confirm: {
       del_diff: "要抛下我（谱面）吗？",
       vsb: "搬史要交税。",
     },
     notify: {
       move_error: "搬不动。v50",
     }
   }*/
}

const base = reactive(utils.deepCopy(LanguageData['简中']))

export default base
watch(settings.lang, (v) => {
  utils.assign(base, LanguageData[v])
})
