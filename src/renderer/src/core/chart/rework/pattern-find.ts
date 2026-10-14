import { PatternConfig } from './pattern-config'
import { PatternPrimitives } from './pattern-primitives'
import { PatternDef } from './pattern-def'

/**
 * MMA `js/patterns/findPatterns.js` 的逐行移植。
 * 数值、阈值、切片窗口与匹配顺序保持原样。
 */
export namespace PatternFind {
  function pickSpecificFirst(specificList: any, remaining: any): any {
    for (const [name, p] of specificList) {
      const n = p(remaining)
      if (n !== 0) return [n, name]
    }
    return null
  }

  function pickSpecificAll(specificList: any, remaining: any): any {
    const matched: any[] = []
    for (const [name, p] of specificList) {
      const n = p(remaining)
      if (n !== 0) matched.push([n, name])
    }
    return matched
  }

  function resolvedMspb(pattern: any, specificType: any, meanMspb: any): any {
    if (pattern === PatternDef.CorePattern.Density && specificType === 'Inverse') {
      return 0.0
    }
    return meanMspb
  }

  function appendFoundPattern(
    results: any,
    pattern: any,
    specificType: any,
    n2: any,
    remaining: any,
    lastNote: any
  ): any {
    const d = remaining.slice(0, n2)
    const meanMspb = d.reduce((sum: any, x: any) => sum + x.MsPerBeat, 0) / d.length
    const mixed = !d.every(
      (x: any) =>
        Math.abs(x.MsPerBeat - meanMspb) < PatternConfig.PATTERNS_CONFIG.PATTERN_STABILITY_THRESHOLD
    )

    const start = remaining[0].Time
    let end

    if (pattern === PatternDef.CorePattern.Jacks) {
      const endCandidate = n2 < remaining.length ? remaining[n2].Time : lastNote
      end = Math.max(remaining[0].Time + remaining[0].MsPerBeat * 0.5, endCandidate)
    } else {
      end = n2 < remaining.length ? remaining[n2].Time : lastNote
    }

    results.push({
      Pattern: pattern,
      SpecificType: specificType,
      Mixed: mixed,
      Start: start,
      End: end,
      MsPerBeat: resolvedMspb(pattern, specificType, meanMspb)
    })
  }

  function appendCoreMatches(
    results: any,
    pattern: any,
    coreN: any,
    specificList: any,
    remaining: any,
    lastNote: any
  ): any {
    if (coreN === 0) return

    if (PatternConfig.PATTERNS_CONFIG.ENABLE_MULTI_LABEL_SAME_WINDOW) {
      const matched = pickSpecificAll(specificList, remaining)
      if (!matched.length) {
        appendFoundPattern(results, pattern, null, coreN, remaining, lastNote)
        return
      }

      for (const [m, specificType] of matched) {
        appendFoundPattern(results, pattern, specificType, Math.max(coreN, m), remaining, lastNote)
      }
      return
    }

    const picked = pickSpecificFirst(specificList, remaining)
    if (picked == null) {
      appendFoundPattern(results, pattern, null, coreN, remaining, lastNote)
      return
    }

    const [m, specificType] = picked
    appendFoundPattern(results, pattern, specificType, Math.max(coreN, m), remaining, lastNote)
  }

  // ponytail: matchers only read a bounded head window (max 8: COORDINATION_COLUMN_LOCK
  // slice(0,8), WILDCARD_JACK slice(0,6), RELEASE slice(0,4), inverseReady slice(0,5),
  // headRows/destructures <= 5) and use xs.length only as a window guard; appendFoundPattern
  // reads at most index 5 (n2 = max(coreN, specific) <= 5). So an 8-element head-window
  // slice per iteration is bit-for-bit equivalent to the old full-tail view, while the
  // old per-iteration full-tail copy (O(n) per iteration -> O(n^2)) is gone.
  const MATCHER_WINDOW = 8

  function matches(specificPatterns: any, lastNote: any, primitives: any): any {
    const results: any[] = []
    let start = 0

    while (start < primitives.length) {
      const remaining = primitives.slice(start, start + MATCHER_WINDOW)
      appendCoreMatches(
        results,
        PatternDef.CorePattern.Stream,
        PatternDef.CORE_STREAM(remaining),
        specificPatterns.Stream,
        remaining,
        lastNote
      )
      appendCoreMatches(
        results,
        PatternDef.CorePattern.Chordstream,
        PatternDef.CORE_CHORDSTREAM(remaining),
        specificPatterns.Chordstream,
        remaining,
        lastNote
      )
      // 原样保留 `specificPatterns.Jack`（findPatterns.js:107 的写法），不要改成 `Jacks`。
      // 核对过 `js/patterns/patternsDef.js:549` 的 `makeSpecificPatterns` 注册键确实是
      // `Jack: jack`（pattern-def.ts:561 同），所以这里能正常取到列表 —— 任务说明里
      // "注册键是 Jacks、导致匹配不到子类型"的前提与源码不符，无需任何修复。
      appendCoreMatches(
        results,
        PatternDef.CorePattern.Jacks,
        PatternDef.CORE_JACKS(remaining),
        specificPatterns.Jack,
        remaining,
        lastNote
      )
      appendCoreMatches(
        results,
        PatternDef.CorePattern.Coordination,
        PatternDef.CORE_COORDINATION(remaining),
        specificPatterns.Coordination,
        remaining,
        lastNote
      )
      appendCoreMatches(
        results,
        PatternDef.CorePattern.Density,
        PatternDef.CORE_DENSITY(remaining),
        specificPatterns.Density,
        remaining,
        lastNote
      )
      appendCoreMatches(
        results,
        PatternDef.CorePattern.Wildcard,
        PatternDef.CORE_WILDCARD(remaining),
        specificPatterns.Wildcard,
        remaining,
        lastNote
      )

      start += 1
    }

    return results
  }

  export function find(chart: any): any {
    const primitives = PatternPrimitives.calculatePrimitives(chart)
    let keymodePatterns

    if (chart.Keys === 4) keymodePatterns = PatternDef.SPECIFIC_4K()
    else if (chart.Keys === 7) keymodePatterns = PatternDef.SPECIFIC_7K()
    else keymodePatterns = PatternDef.SPECIFIC_OTHER()

    return matches(keymodePatterns, chart.LastNote - chart.FirstNote, primitives)
  }
}
