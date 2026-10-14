import { PatternConfig } from './pattern-config'
import { PatternFind } from './pattern-find'
import { PatternClustering } from './pattern-clustering'
import { PatternDef } from './pattern-def'
import { PatternPrimitives } from './pattern-primitives'
import { PatternChart } from './pattern-chart'
import { PatternCategorise } from './pattern-categorise'

/**
 * MMA `js/patterns/summary.js` 的逐行移植。
 *
 * `service.js` 的 `analyzePatternFromText`（文本入口）在本项目无调用方，已移除；
 * 返回对象上的 `get ImportantClusters()` 必须保持 getter 语义。
 */
export namespace PatternSummary {
  const LN_CORE_PATTERNS = new Set(['Coordination', 'Density', 'Wildcard'])

  function hbRowRatio(chart: any): any {
    const rows = chart?.Notes || []
    if (!rows.length) return 0

    let hbRows = 0
    for (const row of rows) {
      const data = Array.isArray(row?.Data) ? row.Data : []
      const hasHead = data.some((n: any) => n === PatternChart.NoteType.HOLDHEAD)
      const hasNormal = data.some((n: any) => n === PatternChart.NoteType.NORMAL)
      if (hasHead && hasNormal) {
        hbRows += 1
      }
    }

    return hbRows / rows.length
  }

  function resolveModeTag(lnRatio: any, hbRatio: any): any {
    const tag = PatternConfig.modeTagFromLnRatio(lnRatio)
    if (tag !== 'Mix') return tag
    if (hbRatio >= PatternConfig.PATTERNS_CONFIG.HB_ROW_RATIO_THRESHOLD) return 'HB'
    return 'Mix'
  }

  export function fromChart(chart: any): any {
    const lnRatio = PatternPrimitives.lnPercent(chart)
    const hbRatio = hbRowRatio(chart)
    const modeTag = resolveModeTag(lnRatio, hbRatio)

    let patterns = PatternFind.find(chart)
    if (modeTag === 'RC') {
      patterns = patterns.filter((p: any) => !LN_CORE_PATTERNS.has(p.Pattern))
    }

    const clusters = PatternClustering.calculateClusteredPatterns(patterns, { modeTag })
      .filter((c: any) => c.BPM > 25 || c.BPM === 0)
      .sort((a: any, b: any) => b.Amount - a.Amount)

    function canBePruned(cluster: any): any {
      for (const other of clusters) {
        if (
          other.Pattern === cluster.Pattern &&
          other.Amount * 0.5 > cluster.Amount &&
          other.BPM > cluster.BPM
        ) {
          return true
        }
      }
      return false
    }

    const filtered = clusters.filter((c: any) => !canBePruned(c))

    const prunedClusters: any[] = []
    for (const pattern of PatternDef.CORE_PATTERN_LIST) {
      prunedClusters.push(...filtered.filter((c: any) => c.Pattern === pattern).slice(0, 3))
    }
    prunedClusters.sort((a: any, b: any) => b.Importance - a.Importance)

    const svAmount = PatternPrimitives.svTime(chart)
    const category = PatternCategorise.categoriseChart(chart.Keys, prunedClusters, svAmount)

    return {
      Clusters: prunedClusters,
      Category: category,
      LNPercent: lnRatio,
      HBRowRatio: hbRatio,
      ModeTag: modeTag,
      SVAmount: svAmount,
      Duration: chart.LastNote - chart.FirstNote,
      get ImportantClusters() {
        if (!this.Clusters.length) return []
        const importance = this.Clusters[0].Importance
        const out: any[] = []
        for (const c of this.Clusters) {
          if (c.Importance / importance > PatternConfig.PATTERNS_CONFIG.IMPORTANT_CLUSTER_RATIO)
            out.push(c)
          else break
        }
        return out
      }
    }
  }
}
