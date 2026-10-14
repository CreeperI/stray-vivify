import { PatternConfig } from './pattern-config'
import { PatternDef } from './pattern-def'

/**
 * MMA `js/patterns/clustering.js` 的逐行移植。
 *
 * 注意：每个簇的 `get Importance()` 与 `format(rate = 1.0)` 必须保持
 * getter / 方法语义（不要展开成普通字段，也不要提前求值）。
 */
export namespace PatternClustering {
  function patternAmount(sortedStartsEnds: any): any {
    let totalTime = 0
    let [currentStart, currentEnd] = sortedStartsEnds[0]

    for (const [start, end] of sortedStartsEnds) {
      if (currentEnd < end) {
        totalTime += currentEnd - currentStart
        currentStart = start
        currentEnd = end
      } else {
        currentEnd = Math.max(currentEnd, end)
      }
    }

    totalTime += currentEnd - currentStart
    return totalTime
  }

  function createClusterBuilder(value: any): any {
    return {
      SumMs: value,
      OriginalMsPerBeat: value,
      Count: 1,
      BPM: null as any,
      add(v: any) {
        this.Count += 1
        this.SumMs += v
      },
      calculate() {
        const average = this.SumMs / this.Count
        this.BPM = average <= 0 ? 0 : Math.round(60000.0 / average)
      },
      get Value() {
        return this.BPM
      }
    }
  }

  function assignClusters(patterns: any): any {
    const bpmsNonMixed: any[] = []
    const bpmsMixed = new Map()

    function addToCluster(msPerBeat: any): any {
      for (const c of bpmsNonMixed) {
        if (
          Math.abs(c.OriginalMsPerBeat - msPerBeat) <
          PatternConfig.PATTERNS_CONFIG.BPM_CLUSTER_THRESHOLD
        ) {
          c.add(msPerBeat)
          return c
        }
      }
      const c = createClusterBuilder(msPerBeat)
      bpmsNonMixed.push(c)
      return c
    }

    function addToMixedCluster(pattern: any, value: any): any {
      if (bpmsMixed.has(pattern)) {
        const c = bpmsMixed.get(pattern)
        c.add(value)
        return c
      }
      const c = createClusterBuilder(value)
      bpmsMixed.set(pattern, c)
      return c
    }

    const patternsWithClusters: any[] = []
    for (const p of patterns) {
      const c = p.Mixed ? addToMixedCluster(p.Pattern, p.MsPerBeat) : addToCluster(p.MsPerBeat)
      patternsWithClusters.push([p, c])
    }

    for (const c of bpmsNonMixed) c.calculate()
    for (const c of bpmsMixed.values()) c.calculate()

    return patternsWithClusters
  }

  function specificClusters(patternsWithClusters: any, options: any = {}): any {
    const modeTag = options.modeTag || 'Mix'
    const groups = new Map()

    for (const [p, c] of patternsWithClusters) {
      const key = `${p.Pattern}@@${p.Mixed ? 1 : 0}@@${c.Value}`
      if (!groups.has(key)) {
        groups.set(key, { pattern: p.Pattern, mixed: p.Mixed, bpm: c.Value, data: [] })
      }
      groups.get(key).data.push([p, c])
    }

    const out: any[] = []
    for (const group of groups.values()) {
      const startsEnds = group.data
        .map(([m]: any) => [m.Start, m.End])
        .sort((a: any, b: any) => a[0] - b[0])

      const dataCount = group.data.length
      const counter = new Map()
      for (const [m] of group.data) {
        if (m.SpecificType != null) {
          counter.set(m.SpecificType, (counter.get(m.SpecificType) || 0) + 1)
        }
      }

      const specificTypes: any = [...counter.entries()]
        .map(([name, count]: any) => [name, count / dataCount])
        .sort((a: any, b: any) => b[1] - a[1])

      const dominantSpecific = specificTypes.length ? specificTypes[0][0] : null
      const amount = startsEnds.length ? patternAmount(startsEnds) : 0

      out.push({
        Pattern: group.pattern,
        SpecificTypes: specificTypes,
        RatingMultiplier: PatternDef.resolveRatingMultiplier(
          group.pattern,
          dominantSpecific,
          modeTag
        ),
        BPM: group.bpm,
        Mixed: group.mixed,
        Amount: amount,
        get Importance() {
          return this.Amount * this.RatingMultiplier * Number(this.BPM)
        },
        format(rate = 1.0) {
          const name =
            this.SpecificTypes.length > 0 &&
            this.SpecificTypes[0][1] >=
              PatternConfig.PATTERNS_CONFIG.CLUSTER_SPECIFIC_NAME_MIN_RATIO
              ? this.SpecificTypes[0][0]
              : this.Pattern
          if (this.Mixed) {
            return `~${Math.round(Number(this.BPM) * rate)}BPM Mixed ${name}`
          }
          return `${Math.round(Number(this.BPM) * rate)}BPM ${name}`
        }
      })
    }

    const hasDW = out.some((c: any) => c.Pattern === 'Density' || c.Pattern === 'Wildcard')
    if (hasDW && PatternConfig.PATTERNS_CONFIG.RELEASE_WITH_DW_MULTIPLIER !== 1.0) {
      for (const c of out) {
        if (c.SpecificTypes.some(([name, ratio]: any) => name === 'Release' && ratio > 0)) {
          c.RatingMultiplier *= PatternConfig.PATTERNS_CONFIG.RELEASE_WITH_DW_MULTIPLIER
        }
      }
    }

    return out
  }

  export function calculateClusteredPatterns(patterns: any, options: any = {}): any {
    const pwc = assignClusters(patterns)
    return specificClusters(pwc, options)
  }
}
