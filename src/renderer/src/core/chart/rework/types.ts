/**
 * rework 模块的共享类型。与 MMA 的 JS 实现保持字段同名同义，
 * 供 fn-mma.vue 等消费方使用，避免在组件里散落 any。
 */
export namespace Rework_Types {
  /** C 档支持的算法（Azusa/Roxy/Mixed/Companella 未移植） */
  export type Algorithm = 'Sunny' | 'Daniel'

  export type Graph = {
    times: number[]
    values: number[]
  }

  /**
   * Sunny 的 ppMetrics（仅 withPpMetrics 时产出）。
   * 本轮未做 PP 面板，但类型保留，后续接 reworkPerformance 时直接可用。
   */
  export type PpMetrics = {
    star: number
    variety: number
    accScalar: number
    totalNotes: number
    spikiness: number
    switches: number
  }

  export type EstimateResult = {
    star: number
    lnRatio: number
    columnCount: number
    estDiff: string
    numericDifficulty: number | null
    numericDifficultyHint: string | null
    graph: Graph | null
    ppMetrics?: PpMetrics
    /** 实际执行的算法（Daniel 非 4K 会回退成 Sunny） */
    actualEstimatorAlgorithm: string
    errors: string[]
  }

  export type AnalyzeOptions = {
    algorithm?: Algorithm
    /** 倍速（时间轴缩放），默认 1.0 */
    speedRate?: number
    /** OD（stray-vivify 的 diff 不保存 OverallDifficulty），默认 8.0 */
    od?: number
    classicMod?: boolean
    extendedEstimationRange?: boolean
    enableAlwaysShowLNDifficulty?: boolean
    withGraph?: boolean
    withPpMetrics?: boolean
    /** pattern 分类改为按 Amount 而不是 Importance（MMA 的 debugUseAmount） */
    debugUseAmount?: boolean
    /** SV 量超阈值时把 Category 覆盖为 "SV"（MMA 的 useSvDetection） */
    useSvDetection?: boolean
    /** 键数下限，等价于 Storage.settings.min_lane，默认 4 */
    minLane?: number
  }

  /** 键型聚类（保留原实现的 Importance getter / format 方法语义） */
  export type Cluster = {
    Pattern: string
    SpecificTypes: [string, number][]
    RatingMultiplier?: number
    BPM: number
    Mixed?: boolean
    Amount: number
    Importance?: number
    format?: (rate?: number) => string
  }

  /** 五条键型进度条中的一条（对应 MMA display.js buildPatternItemData 的输出） */
  export type PatternBarItem = {
    empty: boolean
    label: string
    subtype: string
    width: string
  }

  /** 可直接渲染的键型分析结果 */
  export type PatternPresentation = {
    clusters: Cluster[]
    bars: PatternBarItem[]
    category: string
    modeTag: string
    svTag: boolean
    lnPercent: number
    hbRowRatio: number
    svAmount: number
    duration: number
    /** 为了适配编辑器允许的「LN 体内音符」而由解析器忽略掉的音符数（见 PatternOsuParser.stackedStats） */
    droppedNotes: number
    error: string | null
  }
}
