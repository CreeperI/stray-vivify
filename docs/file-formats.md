# stray/vivify 文件格式

本文说明本应用及其游戏侧会读取、写入的各类文件格式。除特别说明外，文本文件均为 UTF-8 纯文本；ZIP 包内的条目直接位于压缩包根目录，不再额外套一层文件夹。

## 1. `.vsc`：谱面文件

`.vsc` 是纯文本文件，由游戏读取，用来描述一个难度的谱面。一个文件只对应一个难度，内部按时间顺序记录音符与 BPM 变化等内容。应用侧通过 `Chart_diff.to_vsc` 生成文本（见 [`diff.ts`](../src/renderer/src/core/chart/diff.ts)），再按难度名写出为 `Opening.vsc`、`Middle.vsc`、`Finale.vsc` 或 `Encore.vsc`。

## 2. `.vsm`：特效文件

`.vsm` 是纯文本文件，由游戏读取，用来描述该难度的特效（gimmick）等演出信息。它与同名的 `.vsc` 配对使用，例如 `Opening.vsc` 对应 `Opening.vsm`；`global.vsm` 则是所有难度共用的全局特效文件。两者都是可选的。本应用不生成也不解析 `.vsm` 的内容，只按文件名配对原样携带。

## 3. `.vsp` / `.zip`：游戏谱面包

`.vsp` 是专门为游戏导出的谱面包，本质是 ZIP 压缩包，后缀也可能是 `.zip`。包内文件名的大小写并不固定（例如可能全部为小写），读取时应当忽略大小写。下面是规范写法下的目录结构，`# 可选` 表示该条目可以不存在：

```text
song.vsp
├── Opening.vsc
├── Opening.vsm
├── Middle.vsc
├── Middle.vsm
├── Finale.vsc
├── Finale.vsm
├── Encore.vsc
├── Encore.vsm
├── global.vsm
├── info.json
├── music.ogg
├── preview.ogg
└── jacket.png
```

四个难度文件彼此独立，需要哪些难度就放哪些难度；对应的 `.vsm` 也只在需要特效时提供。`info.json` 与 `music.ogg` 是游戏读取曲目所必需的，`preview.ogg` 用于试听，`jacket.png` 用于曲绘。由本应用导出时，如果勾选了 SV，还会额外带上 `vs-chart.json` 等应用侧文件，按设计不影响游戏读取。

## 4. `info.json`：曲目元数据

`info.json` 是 JSON 文件，固定放在谱面包根目录，由游戏读取。其结构对应 [`types.d.ts`](../src/preload/types.d.ts) 中的 `CustomSongInfo`，字段如下：

| 字段                          | 类型       | 说明                                                               |
| ----------------------------- | ---------- | ------------------------------------------------------------------ |
| `chart_id`                    | `string`   | 谱面的唯一标识，通常与曲目文件夹/包名一致                          |
| `name`                        | `string`   | 曲名原文                                                           |
| `formatted_name`              | `string`   | 格式化名称，通常为罗马字或展示用写法；不需要区分时可与 `name` 相同 |
| `artist`                      | `string`   | 曲师                                                               |
| `sort_artists`                | `string[]` | 排序用的艺术家名列表，可以包含多个别名或写法                       |
| `bpm_display`                 | `string`   | 展示用的 BPM，字符串形式，可写 `"191"` 之类的文本                  |
| `version`                     | `string`   | 谱面数据版本；应用导出模板默认使用 `"9.9.9"`                       |
| `is_original`                 | `false`    | 是否为原曲数据；自定义谱面固定为 `false`                           |
| `is_published`                | `boolean`  | 是否发布，即是否在曲库中显示                                       |
| `jacket_artist`               | `string`   | 曲绘画师；未知时填 `"N/A"`                                         |
| `has_encore`                  | `boolean`  | 是否存在 Encore 难度，对应第 4 个难度槽位                          |
| `difficulty_constant_1`～`_4` | `number`   | 各难度的定数，用于游戏内难度计算                                   |
| `difficulty_display_1`～`_4`  | `string`   | 各难度显示用的定数文本，可与实际定数不同，例如 `"15+"`             |
| `note_designer_1`～`_4`       | `string`   | 各难度的谱师名                                                     |
| `enc_data`                    | `object`   | 可选，仅 Encore/Backstage 需要独立资源与曲目信息时提供             |

`unlock` 属于游戏侧解锁配置，本文不展开；制作谱面时沿用导出模板中的默认对象即可。

字段名中的数字 1～4 与难度的对应关系如下，`.vsc`、`.vsm` 以及 `info.json` 中的难度字段共用这一套编号：

| 编号 | 难度    | 短名 | 谱面文件      | 特效文件      |
| ---- | ------- | ---- | ------------- | ------------- |
| 1    | Opening | opn  | `Opening.vsc` | `Opening.vsm` |
| 2    | Middle  | mid  | `Middle.vsc`  | `Middle.vsm`  |
| 3    | Finale  | fin  | `Finale.vsc`  | `Finale.vsm`  |
| 4    | Encore  | enc  | `Encore.vsc`  | `Encore.vsm`  |

`enc_data` 可选，存在时包含以下子字段，用来为 Encore 指定独立于主曲目的资源与展示信息：

| 子字段            | 类型     | 说明                              |
| ----------------- | -------- | --------------------------------- |
| `audio_id`        | `string` | Encore 使用的音频标识或文件名     |
| `preview_id`      | `string` | Encore 使用的试听音频标识或文件名 |
| `jacket`          | `string` | Encore 使用的曲绘标识或文件名     |
| `bpm_display`     | `string` | Encore 展示用的 BPM               |
| `name`            | `string` | Encore 的曲名                     |
| `formatted_name`  | `string` | Encore 的格式化名称               |
| `artist`          | `string` | Encore 的曲师                     |
| `jacket_designer` | `string` | Encore 曲绘的画师                 |

## 5. `.svc` / `.zip`：应用谱面包

`.svc` 是本应用自己的谱面打包格式，本质同样是 ZIP 压缩包，后缀也可能是 `.zip`。它用于备份、迁移或在应用之间共享完整谱面，游戏不会直接读取。其结构可以参考 [`chart-manager.ts`](../src/main/chart-manager.ts) 中的 `_export_chart`：

```text
<chart-id>.svc
├── song.<音频扩展名>     # 原始音频，扩展名保持不变
├── vs-chart.json        # 应用谱面数据
└── song.<图片扩展名>     # 可选，曲绘/封面
```

`song` 的音频扩展名沿用原文件，常见为 `.mp3`、`.wav`、`.ogg`、`.m4a`；可选的图片支持 `.jpg`、`.png`、`.gif`、`.webp`。`vs-chart.json` 保存应用的完整谱面数据，旧版本中的文件名可能是 `chart.json`。应用导入时会在压缩包根目录查找 `vs-chart.json` 或 `chart.json`，并至少需要一个受支持扩展名的音频条目，缺少其中任意一项都会拒绝导入。

## 6. `.osz`：osu! 谱面包

`.osz` 是 osu! 的标准谱面包格式，本应用仅将其用于导入。格式说明请见 osu! 官方 Wiki：<https://osu.ppy.sh/wiki/en/Client/File_formats>。
