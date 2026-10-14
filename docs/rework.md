# rework —— osu!mania 难度估算与键型分析

> 目标读者：AI / 后续维护者。本文描述 stray-vivify 中从 **ManiaMapAnalyser (MMA by Leo_Black)** 移植过来的难度估算（Sunny / Daniel）与键型分析（Pattern）模块：文件划分、对外 API、数据流、与上游的**全部有意偏离**、验证手段、已知坑与后续接入点。
>
> 引用约定：`path:symbol` 形式。上游路径以 `MMA/` 指代
> `L:\Code\osumania_map_analyser\ManiaMapAnalyser by Leo_Black\`。行号为编写时快照，定位请以符号名为准。
>
> 相关文档：上游的 `docs/features/difficulty-estimation.md`、`docs/features/pattern-analysis.md`、`docs/features/mode-tagging.md`（描述 MMA 的完整体系，其中相当一部分**未**移植，见 §11）。

---

## 1. 范围

### 已移植

| 能力 | 上游来源 | 说明 |
| --- | --- | --- |
| **Sunny** 星数 / LN 比 / 难度曲线 / ppMetrics | `MMA/js/rework/sunnyAlgorithm.js` + `js/estimator/sunnyEstimator.js` | 全量移植，含 `withGraph` / `withPpMetrics` / `classicMod` 三个分支 |
| **Daniel** 星数与段位 | `MMA/js/rework/danielAlgorithm.js` + `js/estimator/danielEstimator.js` | 全量移植（4K 用自有 dan 标签；非 4K 走 `estDiff` 区间表） |
| **段位区间表** | `MMA/js/estimator/intervals/*` | 11 张表 + `DAN_INDEX`（4/6/7/10K） |
| **区间查表与段位派生** | `MMA/js/estimator/reworkEstimatorUtils.js` | `estDiff` / `estimateDanielDan` / `normalizeReworkResult`（`estDiff2` 因 SunnyWindow 未移植而无调用方，已删除） |
| **数值内核** | `MMA/js/rework/reworkMathCore.js` | 15 个导出，逐行一致 |
| **键型分析** | `MMA/js/patterns/*` + `js/parser/patternOsuParser.js` | 6 个核心模式、各键数具体子类型、聚类、分类、汇总 |
| **`.osu` 解析** | `MMA/js/parser/osuFileParser.js` + `noteColumn.js` | 保留文本路径（`process()`），另加直构入口 |
| **展示层纯函数** | `MMA/js/app/display.js` + `config.js` 的 `starStops` | 星数配色、可读文字色、簇合并、进度条数据 |
| **UI 卡片** | `MMA/index.html` 卡片 + `styles/{star,bars,status}.css` | 见 §10 |

### 未移植（详见 §11）

Roxy、Azusa、Mixed（路由/融合）、Companella（ONNX）、ETT/MinaCalc（WASM）、Interlude、SunnyWindow、马拉松时长修正、ReworkPP（PP 计算）、难度图渲染、SV 检测、vibro 检测、暂停相关的一切、结果缓存、Worker。

---

## 2. 文件清单

全部位于 `src/renderer/src/core/chart/rework/`，**每个文件一个 `export namespace`**（避免污染 IDE 的 import 提示）。总计 19 个文件、6417 行。

| 文件 | namespace | 行数 | 上游来源 | 职责 |
| --- | --- | --- | --- | --- |
| `types.ts` | `Rework_Types` | 95 | —（新写） | 选项 / 结果 / 展示类型 |
| `diff-notes.ts` | `Rework_DiffNotes` | 154 | 已删除的 `calc-stat.parse_diff_to_om` | `ChartTypeV2.diff` → 单键音符表 |
| `parser.ts` | `Rework_Parser` | 438 | `js/parser/osuFileParser.js` + `noteColumn.js` | `.osu` 解析类 + `parseFromSource` 直构入口 |
| `intervals.ts` | `Rework_Intervals` | 916 | `js/estimator/intervals/*` | 11 张区间表 + `DAN_INDEX` |
| `estimator-utils.ts` | `Rework_EstimatorUtils` | 170 | `js/estimator/reworkEstimatorUtils.js` | `estDiff`/`estimateDanielDan`/`normalizeReworkResult` |
| `math-core.ts` | `Rework_MathCore` | 318 | `js/rework/reworkMathCore.js` | 二分/插值/平滑/角点内核 |
| `sunny.ts` | `Rework_Sunny` | 1119 | `js/rework/sunnyAlgorithm.js` + `sunnyEstimator.js` | Sunny 算法 + `runSunnyEstimatorFromText` |
| `daniel.ts` | `Rework_Daniel` | 657 | `js/rework/danielAlgorithm.js` + `danielEstimator.js` | Daniel 算法 + `runDanielEstimatorFromText` |
| `display.ts` | `Rework_Display` | 290 | `js/app/display.js`（纯计算部分） | 配色 / 文本 / 簇合并 / 进度条数据 |
| `pattern-config.ts` | `PatternConfig` | 156 | `js/patterns/config.js` | 全部阈值与倍率表、`modeTagFromLnRatio` |
| `pattern-chart.ts` | `PatternChart` | 52 | `js/patterns/chart.js` | `NoteType` 与 chart 结构（getter 保留） |
| `pattern-primitives.ts` | `PatternPrimitives` | 242 | `js/patterns/primitives.js` | 逐行特征、`lnPercent`、`svTime` |
| `pattern-def.ts` | `PatternDef` | 766 | `js/patterns/patternsDef.js` | 6 个核心匹配器 + 具体子类型注册表 + 倍率 |
| `pattern-find.ts` | `PatternFind` | 185 | `js/patterns/findPatterns.js` | 滑动窗口模式发现 |
| `pattern-clustering.ts` | `PatternClustering` | 169 | `js/patterns/clustering.js` | 按 BPM 聚簇、`Amount`/`Importance` |
| `pattern-categorise.ts` | `PatternCategorise` | 61 | `js/patterns/categorise.js` | `Category` 判定 |
| `pattern-summary.ts` | `PatternSummary` | 101 | `js/patterns/summary.js` | 汇总 `fromChart`（上游 `service.js` 的文本入口已删除） |
| `pattern-osu-parser.ts` | `PatternOsuParser` | 257 | `js/parser/patternOsuParser.js` | 仅 `parseFromParts` 直构路径（文本路径已删除） |
| `index.ts` | `Rework` | 271 | `js/pipeline/runAnalysisPipeline.js`（分派部分） | 对外入口 + 全部子模块再导出 |

UI 组件：`src/renderer/src/components/chart-v2/chart-tabs/small/fn-mma.vue`（476 行，已挂载在 `chart-main.vue` 的 `chart-fn` 栏）。

---

## 3. 对外 API

只从 `index.ts` 导入即可：

```ts
import { Rework, Rework_Types } from '@renderer/core/chart/rework'
```

### 3.1 入口

| 函数 | 说明 |
| --- | --- |
| `Rework.runEstimator(diff, options)` | 难度估算。返回 `Rework_Types.EstimateResult`。**同步**，重 |
| `Rework.presentPattern(diff, options)` | 键型分析 + 展示层整理。返回 `Rework_Types.PatternPresentation`。**同步**，轻 |

（`Rework.DEFAULT_OD = 8.0` 是 namespace 内私有常量；`Rework.analyze` 组合入口与 `Rework.ALGORITHMS` 因无人调用已删除。）

其余子 namespace（`Rework_Sunny`、`PatternDef`、`Rework_Intervals` …）也全部再导出，供调试与将来扩展。**各 namespace 内部的辅助符号已按"只在文件内使用"取消 `export`**（如 `intervals.ts` 的 11 张表本身、`pattern-def.ts` 的 30 余个具体匹配器、`display.ts` 的配色工具），对外只留真正被调用的 API。

### 3.2 选项（`Rework_Types.AnalyzeOptions`）

| 字段 | 默认 | 作用 |
| --- | --- | --- |
| `algorithm` | `'Sunny'` | `'Sunny'` / `'Daniel'` |
| `od` | `8.0` | 写入 parser 的 `od`（= .osu 的 `OverallDifficulty`）。**diff 里不保存 OD**（`osz-reader.ts` 导入时丢弃） |
| `speedRate` | `1.0` | 时间轴缩放；影响所有算法 |
| `classicMod` | `false` | `false` = `CArrV2`（v2 密度表，lazer/ScoreV2 口径）；`true` = `CArr`（stable/ScoreV1）。**只**切换 Sunny 的 `effectiveWeights` 一行，不动 v2Acc/PP |
| `enableAlwaysShowLNDifficulty` | `false` | `false` 时 `lnRatio < 0.15` 的谱只显示 RC 段标签 |
| `extendedEstimationRange` | `false` | 4K/7K-RC 改用 extended 区间表 |
| `withGraph` | `false` | 是否产出 `graph: { times, values }` |
| `withPpMetrics` | `false` | 是否产出 `ppMetrics`（variety 是 O(unique-gap²)，故默认关） |
| `debugUseAmount` | `false` | `Category` 改取 `Amount` 最大的簇而非 `Importance` |
| `useSvDetection` | `false` | 打开后 `SVAmount ≥ 2000ms` 会把 `Category` 覆盖成 `SV` 并点亮 `svTag` |
| `minLane` | `4` | 键数下限，等价于 `Storage.settings.min_lane`（不读 Storage，保持模块纯净） |

### 3.3 结果结构

```ts
interface EstimateResult {
  star: number                  // Sunny 原始 sr（Daniel 时是 Daniel 自己的 sr）
  lnRatio: number               // LN 头 / 全部物件
  columnCount: number           // = max_lane
  estDiff: string               // "Reform 6 low" / "Reform 6 low || LN 6 mid" / "< Alpha Low"
  numericDifficulty: number | null
  numericDifficultyHint: string | null   // Azusa 风格 code 或 'N/A'
  graph: { times: number[]; values: number[] } | null
  ppMetrics?: PpMetrics
  actualEstimatorAlgorithm: string
  errors: string[]              // "Rework failed: ..."
}

interface PatternPresentation {
  clusters: Cluster[]           // 已按 Pattern 合并（mergeDuplicateClusters）
  bars: PatternBarItem[]        // 最多 5 条，**不补空条**；{ empty, label, subtype, width }
  category: string              // "Jumpstream Tech" / "Coordination" / "Uncategorised"
  modeTag: string               // RC | LN | HB | Mix
  svTag: boolean                // 因 useSvDetection 默认关，恒 false
  lnPercent, hbRowRatio, svAmount, duration: number
  droppedNotes: number          // 被解析器忽略的 stacknote 数
  error: string | null
}
```

### 3.4 已清理的未使用 API

按"没有调用方就删掉"处理，以下符号已从本模块移除（**不是**未实现，是删掉了死代码）：

| 已删除 | 原位置 | 说明 |
| --- | --- | --- |
| `Rework.analyze` | `index.ts` | 组合入口；UI 为了分帧让出主线程而分两次调用，故无人用 |
| `Rework.ALGORITHMS` | `index.ts` | 配算法下拉框用，下拉框已移除 |
| `DEFAULT_OD` 的 export | `index.ts` | 改为 namespace 内私有常量 |
| `Rework_Parser.fromDiff` | `parser.ts` | 与 `index.ts` 私有的 `buildParserSource` 重复 |
| `Rework_Parser.clone` | `parser.ts` | 上游 `cloneOsuParser` 的等价物；sunny 自带本地实现，无外部调用方 |
| `Rework_Parser.toOsuText` | `parser.ts` | `.osu` 序列化器（见 §5.2、§7.3） |
| `Rework_EstimatorUtils.estDiff2` | `estimator-utils.ts` | SunnyWindow 专用，未移植 |
| `Rework_Display.shouldUseLightUnitBadgeText` | `display.ts` | 单位徽标对比度，UI 未用 |
| `PatternSummary.analyzeFromText` | `pattern-summary.ts` | 上游 `service.js` 文本入口 |
| `PatternOsuParser.parseFromText` + `parseSections`/`parseKV`/`parseTimingPoints`/`parseHitObjects` | `pattern-osu-parser.ts` | 键型分析的 `.osu` 文本路径 |
| `CHORDSTREAM_4K_DOUBLE_JUMPSTREAM`、`CHORDSTREAM_4K_TRIPLE_JUMPSTREAM` | `pattern-def.ts` | **上游也未注册进 `SPECIFIC_4K()`**，即上游死代码，删除不影响结果 |
| `Rework_Types.PatternReport`、`Rework_Types.AnalyzeResult` | `types.ts` | 无引用 |
| 整个 `difficulty-format.ts`（`Rework_DifficultyFormat`） | — | `numericToRcLabel`/`rcLabelToNumeric` 在本项目无调用方（它们服务于 numeric difficulty 显示与 Azusa/Roxy/Mixed），级联使该文件全部成员失效，故整文件删除。**将来接 Azusa/Roxy/Mixed 或做 numeric difficulty 显示时需要重新移植**（上游 `MMA/js/estimator/rcDifficultyFormat.js`，129 行） |

---

## 4. 数据流

### 4.1 难度估算

```
ChartTypeV2.diff
  └─ Rework.buildParserSource(diff, options)          index.ts（私有）
       ├─ Rework_DiffNotes.fromDiff(diff, { minLane })      ← 音符表（唯一转换源）
       ├─ laneToX()                                       → x = (lane+0.5)·512/keys
       └─ timing → [{ kind:'Uninherited', Time, MsPerBeat = 60000/bpm, Meter = num }]
  └─ Rework_Parser.parseFromSource(source)             → OsuFileParser 实例（不经过文本）
  └─ Rework_Sunny.runSunnyEstimatorFromText('', opts, parsed)
     / Rework_Daniel.runDanielEstimatorFromText('', opts, parsed)
       └─ Rework_MathCore.*、Rework_EstimatorUtils.estDiff / estimateDanielDan
  └─ 有效性校验（isValidResult）→ 失败则回退 Sunny
```

### 4.2 键型分析

```
ChartTypeV2.diff
  └─ Rework_DiffNotes.fromDiff（同上）
  └─ hitObjects / timingPoints（同一份 laneToX 映射）
  └─ PatternOsuParser.parseFromParts(keys, hitObjects, timingPoints)
       └─ buildChart → convertHitObjects（LN 体/尾填充）→ convertTimingPoints + cleanedSv
  └─ PatternSummary.fromChart(chart) → report { Clusters, Category, ModeTag, SVAmount, ... }
  └─ Rework_Display.mergeDuplicateClusters(clusters)      ← 按 Pattern 合并、子类型按 Amount 加权
  └─ （debugUseAmount）→ 按 Amount 排序 + 覆盖 Category
  └─ （useSvDetection）→ SV 覆盖 Category + svTag
  └─ Rework_Display.buildPatternItemData(merged, false)   ← 不补空条，最多 5 条
```

---

## 5. 输入适配（重要）

### 5.1 diff → 音符表

`Rework_DiffNotes.fromDiff` 的行为规范与**已被删除**的 `core/chart/calc-stat.ts: parse_diff_to_om` 逐行对齐（该提交 `1c21bba "removed osu sr*"` 把它和 `calc_sr` 一起删了，因此这里复刻而非复用）：

- `width > 1` 的音符摊平到**第一个空闲列**（`flag` 只记录 LN 占用）；
- `snm === 1`（炸弹）丢弃；`snm === 2`（S/bumper）按普通音符处理（与原函数一致）；
- LN 输出 `{ time, lane, end }`；
- 事件按 `time` 升序、同一时刻按 **`end < note < ln`** 优先级排序，保证 `[time, end)` 严格占用；
- `keys = diff.override?.max_lane ?? max(minLane, max(lane + width))`。

### 5.2 为什么不用 `.osu` 文本

Sunny / Daniel / pattern **都只读解析结果**，没有任何一处需要文本：

- `sunny.ts:99`、`daniel.ts:11` 都是 `parsed ?? new Rework_Parser.OsuFileParser(osuText)` —— 传了 `parsed` 就永远不碰 `osuText`；
- `PatternOsuParser.parseFromParts` 直接吃 `hitObjects` / `timingPoints`。

因此 `runEstimator` 传的是空串 `''`，并**不生成** `.osu` 文本。（历史上曾实现 `toOsuText` 作预留，已按需求删除；将来接 Roxy/ETT 必须加回来，见 §11。）

### 5.3 坐标往返无损

`laneToX(lane, keys) = (lane + 0.5) * (512 / keys)` 把列放在该列中心，`Rework_Parser.xToColumn` 还原后仍为该列（列宽最窄的 18K 下误差也仅 ~0.018 列）。因此 `convertHitObjects` 内部的 `xToColumn` 得到的列号与直构路径完全一致。

### 5.4 有损项（来自上游模型本身的差异）

| 项 | 处理 | 后果 |
| --- | --- | --- |
| `width > 1` | 摊平成单键 | .osu 没有 width 概念；4bumper 之类会少算列数（键数仍由 `max_lane` 决定） |
| `snm === 1` 炸弹 | 丢弃 | 不参与任何计算 |
| `snm === 2` S | 当普通音符 | 与已删除的原函数一致 |
| SV / 绿线 | 不存在 | `SVAmount` 恒 0，除**极端 BPM** 路径（BPM ≤20 / ≥450，或相邻 BPM 比 ≥4）会被强制超过阈值——这就是 7K 长图上 `Category = "SV"` 的来源 |
| OD | 由 `options.od` 提供 | 默认 8.0；真实 OD 已丢失 |

---

## 6. 相对上游的行为偏离（完整清单）

除下表外，所有数值、阈值、`Math.*` 调用、`toFixed`/`round`/`trunc`/`floor` 的选择、循环边界、字段名、注释均保持原样。

| # | 偏离 | 位置 | 理由 | 影响 |
| --- | --- | --- | --- | --- |
| 1 | 音符来源改为 `diff` 直构，不经过 `.osu` 文本 | `diff-notes.ts`、`index.ts` | C 档所有消费者都只读 parsed | 无数值差异（见 §7.2） |
| 2 | **stacknote 不再抛错，改为忽略**（3 处 throw → 计数跳过） | `pattern-osu-parser.ts`（`finishHolds` / `addNote` / `startHold`） | MMA 只面向 osu!/Malody 的合法谱面，遇到「同列音符落在 LN 体内」会抛 `Stacked note` / `Stacked LN`，而 stray-vivify 是自由编辑器、**实测仓库里 21 个真实 diff 有 10 个命中**，抛错会让键型面板整体失败 | 被忽略的音符计入 `stackedStats.ignored` → `PatternPresentation.droppedNotes`，UI 显示 `-N stacked`；实测丢弃量 0–30（≤2.4%） |
| 3 | pattern 进度条**不补空条** | `display.ts: buildPatternItemData(clusters, padToFive)`，`index.ts` 传 `false` | 需求：有几个画几个 | 无簇时组件整段隐藏 Pattern 区 |
| 4 | 不使用 SV 检测 | UI 不传 `useSvDetection` | 需求：不考虑 SV | `svTag` 恒 false，`Category` 不会被覆盖成 `"SV"` |
| 5 | `classicMod` 固定 `false`（CArrV2） | `fn-mma.vue: CLASSIC_MOD` | 需求：使用 v2 | Sunny sr 走 v2 密度表 |
| 6 | `enableAlwaysShowLNDifficulty` 固定 `false` | `fn-mma.vue: ALWAYS_SHOW_LN` | 需求：默认为关 | `lnRatio < 0.15` 时标签无 `|| LN` 段 |
| 7 | 算法固定 `Sunny` | `fn-mma.vue: options()` | 需求：使用 Sunny sr | Daniel 仍在库里可用 |
| 8 | `interpSingle` 死代码保留但非导出 | `sunny.ts`（`void interpSingle;`） | `noUnusedLocals` 要求，且不想改变导出面 | 与上游一致 |
| 9 | `7k-wild` 表保留但未接入 `DAN_INDEX` | `intervals.ts`（`void wild7K;`） | 上游即如此（该表不可达） | 无 |
| 10 | 未移植 `roxyEstimator.js: buildRoxyGraphFromAzusa` | — | 上游死代码（全仓无调用） | 无 |
| 11 | 未移植 `display.js` 的 DOM 部分 | `display.ts` | 本模块保持无 DOM，便于将来搬进 Worker | 渲染改由 Vue 完成 |
| 12 | `Rework_Parser.parseFromSource` 直构入口 | `parser.ts` | 提供跳过文本往返的入口 | 新增 API（`fromDiff`/`clone` 两个无人调用的等价物已删除） |
| 13 | **删除全部无调用方的公开 API 与文本路径** | 见 §3.4 | 需求："没有用的函数就直接删掉" | 行为零变化（回归校验 14/14 一致）；`toOsuText`、`difficulty-format.ts`、键型文本路径等一并移除 |

---

## 7. 数值保真与验证

### 7.1 移植纪律

1. 逐行搬运，**禁止**"优化 / 简化 / 向量化 / 消除重复计算 / 顺手修 bug / 重命名"。包括保留 `Math.max(...noteSeq.map(...))` 这种大谱上有栈溢出隐患的展开写法。
2. 遇到 TS 报错只做最小改动：`: any` / `as any` / `!` / 未使用形参加 `_` 前缀 / 未使用导入用 `void X;` 保留。
3. 上游的本地副本必须保持本地：`sunny.ts` 的 `stepInterp` 与 `computeCAndKs` 与 `Rework_MathCore` 的同名函数**语义不同**（`D1` 精确匹配取前一样本），不能互换。

### 7.2 验证手段与结论

- **机械化逐行比对**（移植时由各文件负责）：归一化掉类型注解/namespace/import 前缀后与上游逐行比对，math-core 为 248 行 vs 248 行**零差异**；sunny 的 `Math.*` 调用序列 65 vs 65 完全一致。
- **真实谱面冒烟**：对仓库 `charts/*/chart.json` 的 21 个 diff 跑完整管线 → 21/21 成功，`patternErrors=0`。
- **直构 vs 文本路径往返校验**（历史记录，文本路径已在 §3.4 的清理中移除）：当时 `Rework_Parser.parseFromSource` 与 `new OsuFileParser(text).process()` 在修复 §7.3 的 bug 后 **21/21 完全一致**（`columns` / `noteStarts` / `noteTypes` / `noteEnds` / `lnRatio` / `columnCount` / `od` / `status` / `timingPoints` 全部逐位相同）。这条记录证明直构路径与上游文本语义等价。
- **删除 `toOsuText` 后的回归**：13 个 diff 的 `star` 与 `estDiff` 与删除前一致。
- **删除未使用 API 后的回归**：14 个 diff、14 条期望值（含 `ignored` 计数）**全部一致**。
- **classic 影响量化**：21 个 diff 上 `CArr` 与 `CArrV2` 的 `star` 平均绝对差 **0.069**、最大 **0.255**；段位标签会跨档。

### 7.3 已修 bug 记录

1. **`[TimingPoints]` 行格式错误**（`toOsuText`，该函数已删除）：曾写成 `${i + 1},${Time},${MsPerBeat},...` 多一个行号前缀，而 osu! 格式是
   `time,beatLength,meter,sampleSet,sampleIndex,volume,uninherited,effects`。后果是解析出的 `time` 变成行号、`uninherited` 变成 100（≠1），**整段 BPM 被丢弃并回退到 `[[0, 500]]`**。修复后往返校验 21/21 一致。
   ⚠️ **将来若为 Roxy/ETT 重新加回序列化器，别再写错这一行。**
2. **键型解析器遇到 stacknote 抛错**：原先在外层做 `sanitizeStackedNotes` 预过滤，后按需求改为在解析器内部忽略（见 §6 第 2 条），外层预过滤已删除。

---

## 8. 已知边界与坑

1. **无区间表的键数**：1K / 5K / 8K 等仍能算出 `star` 与难度曲线，但 `estDiff` 为 `"Unknown difficulty"`（`DAN_INDEX` 只有 4/6/7/10K）。仓库里的 `sidequest` 就是 `override.max_lane = 1` 的 1K 谱，星数正常（如 5.270）、段位 Unknown。
2. **7K 用 `Regular N` 命名**，4K 用 `Reform N`，11 档以上用希腊字母（Alpha…Kappa）。两套来自不同的区间表内容，不是代码分支。
3. **`lnRatio == 0.15` 的边界不一致**（上游既有）：`estDiff` 用 `lnRatio < 0.15` 才隐藏 LN 段（即 ≥0.15 就显示），而 `modeTagFromLnRatio` 用 `<= 0.15 → "RC"`。该点上标签带 LN、模式标签显示 RC。已逐字保留。
4. **纯 Sunny 下的 LN 段位不是独立 LN 星数**：`estDiff` 里 LN 段是**同一个 `sr`** 套 LN 区间表（`estimator-utils.ts:113`）。真正独立的 LN 星数需要未移植的 SunnyWindow（`estDiff2(sr, srLN, ...)`）。
5. **Daniel 在非 4K 上会内部回退 Sunny**（`daniel.ts:619`：`calculateDaniel` 返回 `-3` 时调 `Rework_Sunny.runSunnyEstimatorFromText`），但 `actualEstimatorAlgorithm` 仍是 `"Daniel"` —— 与 MMA pipeline 的行为一致（pipeline 只对 Azusa/Roxy/Mixed 更新该字段）。
6. **Daniel 自己不用 OD**：`danielAlgorithm` 里 OD 硬编码为 9，`odFlag` 形参被忽略。OD 只影响 Sunny / Azusa / Roxy。
7. **`svAmount` 几乎恒 0**：diff 没有绿线，只有极端 BPM 路径会强制超阈值（见 §5.4）。
8. **`SV_AMOUNT_THRESHOLD` 等阈值改动会改结果**：`pattern-config.ts` 里的 30 余个常量是算法的一部分，不是"可调参数"。
9. **`Math.max(...arr)` 栈溢出隐患**保留（上游同款）：超大谱（十万级音符）可能 `RangeError`。
10. **`keys` 受 `minLane` 下限影响**：默认 4，因此 1–3K 谱会被当作 4K（`diff.override.max_lane` 优先，`sidequest` 因此仍是 1K）。
11. **主线程同步**：`runEstimator` / `presentPattern` 都是同步重计算。UI 侧在两者之间 `await utils.nextFrame()` 让出一帧，避免整卡冻结（见 §10）。
12. **`Rework_DiffNotes.isLN`**：`end !== undefined && end > time`；`len === 0` 的 hold 视为普通音符（与 `.osu` 文本路径的语义对齐）。

---

## 9. 性能（实测，本仓库 chart.json）

| 阶段 | 耗时 | 备注 |
| --- | --- | --- |
| `runEstimator`（Sunny） | 4–150 ms | 与音符数强相关；10 923 音符（eternity#2）≈ 140 ms |
| `presentPattern` | 0–184 ms | `PatternFind` 是 O(n × 8 窗口)；10 923 音符 ≈ 184 ms |
| 单张 diff 合计 | 6–330 ms | 含两段之间的让帧 |

Roxy / Azusa / Mixed 未移植，因此没出现"一趟 4–5 次完整 rework"的极端情况；若将来接入，需要重新评估是否需要 Worker。

---

## 10. UI：`fn-mma.vue`

对应 MMA `index.html` 卡片，**已挂载**在 `chart-main.vue` 的 `chart-fn` 栏。

| 区块 | 内容 |
| --- | --- |
| 状态行 | `歌曲名 [diff1 diff2] // Sunny // <耗时>ms`；**点击整行重新计算** |
| star-block | 星数胶囊（背景/文字色由 `Rework_Display.starColorFor` / `pickReadableTextColor` 实时计算）+ `LN%` + `Keys` + 右胶囊（`Category`）+ 段位标签（`\|\|` 拆行）+ caption + 5 个星星点（段位级别） |
| Pattern | 分隔行 + 进度条（有几个画几个，最多 5 条）；`bars.length === 0` 时整段隐藏 |
| mode tag | `RC` / `LN` / `HB` / `Mix` 胶囊（无 SV 徽章）；右侧附 `(N stacked)` —— 被键型解析器忽略的 stacknote 数，仅 N > 0 时显示（带 tooltip 说明原因） |
| 错误 | `fatals` 多于一条时在底部列出 |

**固定选项**（无 UI，都在文件顶部常量）：`OD = 8.0`、`CLASSIC_MOD = false`（v2）、`ALWAYS_SHOW_LN = false`、算法 `Sunny`、不传 `useSvDetection`。

**计算时机**：`onMounted` 跑一次；`watch(diff.diff_index)` 在切换难度时重跑；点击状态行手动重跑（编辑音符后需要手动刷新）。

**样式**：从 MMA `styles/{star,bars,status}.css` 抽取并 scoped 化，**没有使用 CSS 自定义属性**（错峰入场用 `.cluster-item:nth-child(n)` 的 `animation-delay`，条宽用内联标准 `width`）。

---

## 11. 后续接入点

| 未移植模块 | 接入需要什么 | 注意事项 |
| --- | --- | --- |
| **Roxy** | 移植 `roxyEstimator.js`(1522) + `roxyMetaModel.generated.js`；**必须恢复 `.osu` 文本序列化** | 入口 `:1470` 非字符串直接 `EmptyInput`；`:1480` 无条件 `canonicalizeOsuTiming(osuText, …)`；`:1505` speedRate≠1 时重新解析文本 |
| **ETT / MSD 技能条** | 移植 `ett/calc.js` + `versions/index.js`，复制 6 个 minaclac wasm（~1.4 MB） | 入口**没有** parsed 参数，必须真实文本；`DEFAULT_ETTERNA_VERSION = "0.72.3"`，非 4K 固定 0.74.0；浏览器加 `?v=` cache-bust |
| **Azusa** | 移植 `azusaEstimator.js`(905)，只读 parsed，**不需要文本** | LN ratio > 0.18 拒绝（`UnsupportedLN`）；`taps < 80` 拒绝 |
| **Mixed** | 移植 `mixedEstimator.js`(384) + pipeline 的归一化/回退 | 路由依赖 **Roxy 的 `debug` 字段**（`finalNumeric`/`handBias`/`anchorRate`/`meta.references.Azusa`），Roxy 不移植就无法完整接 |
| **Companella** | onnxruntime-web（12.4 MB wasm）+ `dan_model.onnx`(297 KB) | 特征 = 8 个 MSD + InterludeSR + SunnySR；需要 ETT 与 Interlude 先到位 |
| **Interlude** | 移植 `interlude/*`(699)，纯 JS，依赖 `PatternDef`（已在手） | 可直接吃 `Rework_Parser` 实例，**不需要文本** |
| **SunnyWindow** | 移植 `sunnyWindowAlgorithm.js`(1236) + `sunnyWindowEstimator.js` | 提供独立 LN 星数（`estDiff2`）与 `typePercentageData`（All/RC/Mix/HB/LN 成分） |
| **马拉松时长修正** | 移植 `marathonCorrection.js`(120) → 依赖 ETT values | >300 s 的 4K Azusa/Roxy 才触发 |
| **ReworkPP / Max PP** | 移植 `reworkPerformance.js`(95)，开 `withPpMetrics` | Live PP 需要实时判定计数，编辑器里只能做 Max PP |
| **难度图** | 用 `withGraph` 的 `rework.graph`，从 `display.js`/`graph.js` 抽 `graphMath` 与渲染数学 | 已可产出数据；渲染需自写（去掉暂停标记与 tosu 时间线补全） |
| **`toOsuText` 序列化器** | 见 §7.3 第 1 条的格式坑 | 也是"导出 .osu"功能的前置 |
| **`rcDifficultyFormat`**（段位标签 ↔ 数值） | 上游 `js/estimator/rcDifficultyFormat.js`（129 行，纯函数） | 本项目无调用方故已删除；Azusa/Roxy/Mixed 与 numeric difficulty 显示都需要它，接任一功能时要重新移植 |

---

## 12. 维护须知

1. **不要"顺手修 bug"**：上游有些写法看起来是 bug（例如 `findPatterns.js` 的 `specificPatterns.Jack` 与注册键 `Jack` —— 经核实**本来就一致**，不是 bug）。改判定逻辑前先确认它是否是有意行为。
2. **改动阈值/系数 = 改动产物**：`pattern-config.ts`、`sunny.ts` 的系数表、`intervals.ts` 的区间表都属于算法本身。
3. **TS 门槛**：`tsconfig.web.json` 继承 `@electron-toolkit/tsconfig`，开启 `strict` + `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns`，但 **`noImplicitAny: false`**（这是让逐行移植可行的关键）。`npm run build` 会先跑 `vue-tsc --noEmit`，所以提交前请确认 `npx vue-tsc --noEmit -p tsconfig.web.json` 为 0 错误。
4. **ESLint 现状**：本目录会有大量 `@typescript-eslint/no-explicit-any` 与 `no-namespace` 报错（前者是逐行移植策略的必然结果，后者是需求要求的 namespace 语法）。`npm run build` **不跑** eslint，构建不受影响；若想让 IDE 干净，可在 `.eslintrc.cjs` 为本目录加一条 override。
5. **格式**：提交前跑一次 `npx prettier --write "src/renderer/src/core/chart/rework/*.ts"`，与项目风格保持一致。
6. **命名约定**：估算/基础设施用 `Rework_*` 前缀，键型分析用 `Pattern*` 前缀；每个文件一个同名 namespace；`index.ts` 统一再导出。
7. **不要保留死代码**：新增/修改后如果某个导出符号没有任何调用方（含跨文件与同文件），就删掉它——本项目已按此原则清理过一轮（见 §3.4）。判断"未使用"时注意区分"上游也有的死代码"（如那两个未注册的 CHORDSTREAM 匹配器，删了不影响结果）与"上游在用但我们没接的功能"（如 `rcDifficultyFormat`，删了要记得将来补回）。
