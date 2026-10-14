import { ChartTypeV2 } from '@preload/chart-types'
import { Rework_DiffNotes } from './diff-notes'
import { Rework_Parser } from './parser'
import { Rework_Sunny } from './sunny'
import { Rework_Daniel } from './daniel'
import { Rework_Display } from './display'
import { Rework_Types } from './types'
import { PatternConfig } from './pattern-config'
import { PatternOsuParser } from './pattern-osu-parser'
import { PatternSummary } from './pattern-summary'

// 子模块再导出：消费方只需 `import { Rework, Rework_Types } from '.../rework'` ───
// 注意：Rework_Types 只有类型成员，isolatedModules 下必须用 `export type`
export type { Rework_Types } from './types'
export { Rework_DiffNotes } from './diff-notes'
export { Rework_Parser } from './parser'
export { Rework_Display } from './display'
export { Rework_Intervals } from './intervals'
export { Rework_MathCore } from './math-core'
export { Rework_EstimatorUtils } from './estimator-utils'
export { Rework_Sunny } from './sunny'
export { Rework_Daniel } from './daniel'
export { PatternConfig } from './pattern-config'
export { PatternChart } from './pattern-chart'
export { PatternPrimitives } from './pattern-primitives'
export { PatternDef } from './pattern-def'
export { PatternFind } from './pattern-find'
export { PatternClustering } from './pattern-clustering'
export { PatternCategorise } from './pattern-categorise'
export { PatternSummary } from './pattern-summary'
export { PatternOsuParser } from './pattern-osu-parser'

/**
 * rework 对外入口（C 档：Sunny + Daniel 难度估算 + pattern-analysis）。
 *
 * 与 MMA `js/pipeline/runAnalysisPipeline.js` 的对应关系：
 *   - 解析：MMA 用 `new OsuFileParser(rawText).process()`；此处音符来自
 *     `Rework_DiffNotes.fromDiff`（= 已删除的 `calc-stat.parse_diff_to_om` 规范），
 *     再用 `Rework_Parser.parseFromSource` 直接灌进 parser 状态，**不生成 .osu 文本**
 *     （Sunny/Daniel/pattern 都只读解析结果；Roxy/ETT 将来才需要文本）。
 *   - 分派 + 有效性校验 + Sunny 回退：对齐 pipeline 的 `isValidResult` 语义。
 *   - 归一化（Azusa/Roxy/Mixed 的 star 覆盖为 Sunny sr）在 C 档不适用：Sunny 本就
 *     是 Sunny sr，Daniel 按 MMA 语义使用自己的 sr。
 *   - 未移植：Companella 异步推理、ETT(MSD)、Interlude、SunnyWindow、马拉松修正、
 *     ppMetrics 之外的 PP 计算。
 */
export namespace Rework {
  /** stray-vivify 的 diff 不保存 OverallDifficulty，取常见 mania OD 作为默认值 */
  const DEFAULT_OD = 8.0

  /** 与 pipeline 的 `isValidResult` 一致（numericDifficulty 允许 null） */
  function isValidResult(result: any) {
    return (
      Boolean(result) &&
      Number.isFinite(result.star) &&
      (Number.isFinite(result.numericDifficulty) || result.numericDifficulty === null) &&
      typeof result.estDiff === 'string'
    )
  }

  function errText(err: any) {
    return String(err?.message ?? err)
  }

  function estimatorOptions(options: Rework_Types.AnalyzeOptions) {
    return {
      speedRate: Number.isFinite(options.speedRate) ? Number(options.speedRate) : 1.0,
      // OD 由 parser 的 od 字段提供（等价于 .osu 里写了 OverallDifficulty 行）
      odFlag: null,
      cvtFlag: null,
      withGraph: options.withGraph === true,
      withPpMetrics: options.withPpMetrics === true,
      classicMod: options.classicMod === true,
      extendedEstimationRange: options.extendedEstimationRange === true,
      enableAlwaysShowLNDifficulty: options.enableAlwaysShowLNDifficulty === true
    }
  }

  function minLaneOf(options: Rework_Types.AnalyzeOptions) {
    return Number.isFinite(options.minLane) ? Number(options.minLane) : 4
  }

  /** diff → Rework_Parser.Source（音符经 laneToX 放回 .osu 的 x 坐标） */
  function buildParserSource(
    diff: ChartTypeV2.diff,
    options: Rework_Types.AnalyzeOptions
  ): Rework_Parser.Source {
    const src = Rework_DiffNotes.fromDiff(diff, { minLane: minLaneOf(options) })

    const hitObjects: Rework_Parser.HitObject[] = src.notes.map((note) => {
      const x = Rework_DiffNotes.laneToX(note.lane, src.keys)
      if (Rework_DiffNotes.isLN(note)) {
        return { kind: 'Hold', X: x, Time: note.time, EndTime: note.end as number }
      }
      return { kind: 'HitCircle', X: x, Time: note.time }
    })

    return {
      keys: src.keys,
      od: Number.isFinite(options.od) ? Number(options.od) : DEFAULT_OD,
      gameMode: '3',
      status: 'OK',
      hitObjects,
      timingPoints: src.timing.map((t) => ({
        kind: 'Uninherited',
        Time: t.time,
        MsPerBeat: 60000 / t.bpm,
        Meter: t.num
      })),
      metaData: {}
    }
  }

  /**
   * 难度估算。返回结构与 MMA `runXxxEstimatorFromText` 的输出对齐
   * （star / lnRatio / columnCount / estDiff / numericDifficulty / graph）。
   *
   * 注意：Sunny/Daniel 只在**没有 parsed 实例**时才会去读 `osuText`（`preprocessFile` /
   * `preprocessDaniel` 的 `parsed ?? new OsuFileParser(osuText)` 分支）。这里始终传入
   * `parseFromSource` 得到的 parsed，因此文本参数传空串即可、不会被读取。
   * （曾用 `toOsuText` 生成真实 .osu 文本，已按需求移除；若将来接入 Roxy/ETT
   * —— 那两个入口内部强制要求真实文本 —— 需要把序列化器加回来。）
   */
  export function runEstimator(
    diff: ChartTypeV2.diff,
    options: Rework_Types.AnalyzeOptions = {}
  ): Rework_Types.EstimateResult {
    const errors: string[] = []
    const algorithm: Rework_Types.Algorithm = options.algorithm ?? 'Sunny'

    const source = buildParserSource(diff, options)
    const parsed = Rework_Parser.parseFromSource(source)
    const estOptions = estimatorOptions(options)

    let actualEstimatorAlgorithm = algorithm
    let rework: any = null

    try {
      rework =
        algorithm === 'Daniel'
          ? Rework_Daniel.runDanielEstimatorFromText('', estOptions, parsed)
          : Rework_Sunny.runSunnyEstimatorFromText('', estOptions, parsed)
    } catch (err) {
      errors.push(`Rework failed: ${errText(err)}`)
    }

    // 无效结果回退 Sunny 基线（与 pipeline 中 Azusa/Roxy 的回退语义一致；
    // Daniel 自身在 -3 时已内部回退，这里是二次保险）
    if (!isValidResult(rework) && algorithm !== 'Sunny') {
      try {
        rework = Rework_Sunny.runSunnyEstimatorFromText('', estOptions, parsed)
        actualEstimatorAlgorithm = 'Sunny'
      } catch (err) {
        errors.push(`Rework failed: ${errText(err)}`)
        rework = null
      }
    }

    return {
      star: Number(rework?.star ?? Number.NaN),
      lnRatio: Number(rework?.lnRatio ?? Number.NaN),
      columnCount: Number(rework?.columnCount ?? source.keys),
      estDiff: String(rework?.estDiff ?? '-'),
      numericDifficulty:
        rework?.numericDifficulty === null || rework?.numericDifficulty === undefined
          ? null
          : Number(rework.numericDifficulty),
      numericDifficultyHint: rework?.numericDifficultyHint ?? null,
      graph: rework?.graph ?? null,
      ...(rework?.ppMetrics ? { ppMetrics: rework.ppMetrics } : {}),
      actualEstimatorAlgorithm,
      errors
    }
  }

  /** diff → 可直接渲染的键型分析结果（含 MMA display 层的簇合并与 5 条进度条数据） */
  export function presentPattern(
    diff: ChartTypeV2.diff,
    options: Rework_Types.AnalyzeOptions = {}
  ): Rework_Types.PatternPresentation {
    const empty: Rework_Types.PatternPresentation = {
      clusters: [],
      bars: Rework_Display.buildPatternItemData([]),
      category: 'Uncategorised',
      modeTag: 'Mix',
      svTag: false,
      lnPercent: 0,
      hbRowRatio: 0,
      svAmount: 0,
      duration: 0,
      droppedNotes: 0,
      error: null
    }

    const src = Rework_DiffNotes.fromDiff(diff, { minLane: minLaneOf(options) })

    const hitObjects: PatternOsuParser.HitObject[] = src.notes.map((note) => {
      const x = Rework_DiffNotes.laneToX(note.lane, src.keys)
      if (Rework_DiffNotes.isLN(note)) {
        return { kind: 'Hold', X: x, Time: note.time, EndTime: note.end as number }
      }
      return { kind: 'HitCircle', X: x, Time: note.time }
    })

    const timingPoints: PatternOsuParser.TimingPoint[] = src.timing.map((t) => ({
      kind: 'Uninherited',
      Time: t.time,
      MsPerBeat: 60000 / t.bpm,
      Meter: t.num
    }))

    let report: any = null
    try {
      const chart = PatternOsuParser.parseFromParts(src.keys, hitObjects, timingPoints)
      report = PatternSummary.fromChart(chart)
    } catch (err) {
      return { ...empty, error: errText(err) }
    }

    const clusters: any[] = Array.isArray(report?.Clusters) ? report.Clusters : []

    // ── MMA analysis.js:842-856：debugUseAmount 决定分类来源 ──
    let category = String(report?.Category ?? 'Uncategorised')
    let merged = Rework_Display.mergeDuplicateClusters(clusters)
    if (options.debugUseAmount === true) {
      merged = merged.slice().sort((a, b) => Number(b.Amount) - Number(a.Amount))
      const top = merged[0]
      if (top) {
        category =
          Array.isArray(top.SpecificTypes) &&
          top.SpecificTypes.length > 0 &&
          top.SpecificTypes[0][1] > 0.05
            ? top.SpecificTypes[0][0]
            : top.Pattern
      }
    }

    // ── MMA analysis.js:1144-1152：SV 检测覆盖 Category 并点亮 SV 徽章 ──
    // 本项目不使用 SV 检测（不传 useSvDetection 即整段跳过）
    let svTag = false
    const svAmount = Number(report?.SVAmount ?? 0)
    if (options.useSvDetection === true) {
      if (
        Number.isFinite(svAmount) &&
        svAmount >= Number(PatternConfig.PATTERNS_CONFIG.SV_AMOUNT_THRESHOLD)
      ) {
        svTag = true
        category = 'SV'
      }
    }

    const lnPercent = Number(report?.LNPercent ?? 0)
    const modeTag = (report?.ModeTag as string) || PatternConfig.modeTagFromLnRatio(lnPercent)

    return {
      clusters: merged,
      // 不补空条：有几个画几个（最多 5 条）
      bars: Rework_Display.buildPatternItemData(merged, false),
      category,
      modeTag,
      svTag,
      lnPercent,
      hbRowRatio: Number(report?.HBRowRatio ?? 0),
      svAmount,
      duration: Number(report?.Duration ?? 0),
      // 解析器按需求直接忽略 stacknote，这里如实回报被忽略的数量
      droppedNotes: PatternOsuParser.stackedStats.ignored,
      error: null
    }
  }
}
