/**
 * MMA `js/patterns/patternsDef.js` 的逐行移植。
 *
 * 只做移植层面的改动：
 *   1. 包进 `PatternDef` namespace；
 *   2. import 改为 `PatternConfig` / `PatternPrimitives`，解构清单不变；
 *   3. 参数补最小类型标注（`any`）。
 * 所有阈值、匹配判据、别名常量、内部函数名与顺序保持原样
 * （包括 `makeSpecificPatterns` 的 `Jack` 键、`CHORDSTREAM_OTHER_*` /
 *  `DENSITY_OTHER_*` / `DENSITY_7K_INVERSE` 等别名）。
 */
import { PatternConfig } from './pattern-config'
import { PatternPrimitives } from './pattern-primitives'

export namespace PatternDef {
  const {
    COORDINATION_SPECIFIC_ORDER,
    CORE_RATING_MULTIPLIER,
    DENSITY_SPECIFIC_ORDER,
    INVERSE_GAP_TOLERANCE_MS,
    INVERSE_MIN_FILLED_LANES,
    JACKY_CONTEXT_WINDOW,
    JACKY_FALLBACK_MAX_MSPB,
    JACKY_MIN_BPM,
    RELEASE_FULL_MATCH_ROWS,
    RELEASE_MIN_TAIL_ROWS,
    RELEASE_ROLL_POINTS,
    RELEASE_SCAN_ROWS,
    RC_LN_CORE_SCALE,
    RC_CORE_LN_SCALE,
    SHIELD_MAX_BEAT_RATIO,
    SUBTYPE_RATING_MULTIPLIER_BY_MODE,
    WILDCARD_SPECIFIC_ORDER
  } = PatternConfig.PATTERNS_CONFIG

  export const CorePattern = {
    Stream: 'Stream',
    Chordstream: 'Chordstream',
    Jacks: 'Jacks',
    Coordination: 'Coordination',
    Density: 'Density',
    Wildcard: 'Wildcard'
  }

  export const CORE_PATTERN_LIST = Object.values(CorePattern)

  function ratingMultiplier(pattern: any) {
    return CORE_RATING_MULTIPLIER[pattern] ?? 1.0
  }

  export function resolveRatingMultiplier(pattern: any, specificType: any, modeTag: any = 'Mix') {
    const lnCorePatterns = new Set([
      CorePattern.Coordination,
      CorePattern.Density,
      CorePattern.Wildcard
    ])
    const rcCorePatterns = new Set([CorePattern.Stream, CorePattern.Chordstream, CorePattern.Jacks])

    const defaultMultiplier = ratingMultiplier(pattern)

    const subtypeMap: any =
      SUBTYPE_RATING_MULTIPLIER_BY_MODE[modeTag] || SUBTYPE_RATING_MULTIPLIER_BY_MODE.Mix || {}

    let value =
      specificType == null ? defaultMultiplier : (subtypeMap[specificType] ?? defaultMultiplier)

    if (modeTag === 'RC' && lnCorePatterns.has(pattern)) {
      const mixMap = SUBTYPE_RATING_MULTIPLIER_BY_MODE.Mix || {}
      const base =
        specificType == null ? defaultMultiplier : (mixMap[specificType] ?? defaultMultiplier)
      value = base * RC_LN_CORE_SCALE
    }

    if (modeTag === 'LN' && rcCorePatterns.has(pattern)) {
      value *= RC_CORE_LN_SCALE
    }

    return value
  }

  function reorderSpecific(items: any, preferredOrder: any) {
    if (items.length <= 1 || preferredOrder.length === 0) return items
    const orderRank: Map<any, any> = new Map(preferredOrder.map((name, idx) => [name, idx]))
    return items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const ar = orderRank.has(a.item[0]) ? orderRank.get(a.item[0]) : orderRank.size
        const br = orderRank.has(b.item[0]) ? orderRank.get(b.item[0]) : orderRank.size
        if (ar !== br) return ar - br
        return a.index - b.index
      })
      .map((x) => x.item)
  }

  function asHeadPointRow(row: any, previousHeadCols: any) {
    const headCols = row.LNHeads
    const jacks = headCols.length ? headCols.filter((c) => previousHeadCols.includes(c)).length : 0

    let direction = PatternPrimitives.Direction.NONE
    let roll = false
    if (previousHeadCols.length && headCols.length) {
      ;[direction, roll] = PatternPrimitives.detectDirection(previousHeadCols, headCols)
    }

    return {
      Index: row.Index,
      Time: row.Time,
      MsPerBeat: row.MsPerBeat,
      BeatLength: row.BeatLength,
      Notes: headCols.length,
      Jacks: jacks,
      Direction: direction,
      Roll: roll,
      Keys: row.Keys,
      LeftHandKeys: row.LeftHandKeys,
      LNHeads: row.LNHeads,
      LNBodies: row.LNBodies,
      LNTails: row.LNTails,
      NormalNotes: [],
      RawNotes: headCols
    }
  }

  function headRows(xs: any, n: any) {
    const rows: any[] = []
    let prev: any = []
    for (const row of xs.slice(0, n)) {
      const hr = asHeadPointRow(row, prev)
      rows.push(hr)
      if (hr.RawNotes.length) prev = hr.RawNotes
    }
    return rows
  }

  function isSameHandAdjacent(colA: any, colB: any, split: any) {
    if (Math.abs(colA - colB) !== 1) return false
    return colA < split === colB < split
  }

  // Raw jack BPM formula (no f32 wrapper). Shared with interlude/noteDifficulty,
  // which applies its own f32 rounding at the call site.
  function jackBpm(deltaMs: any) {
    if (deltaMs <= 0) return 230
    return Math.min(15000 / deltaMs, 230)
  }

  function isLnHeadContext(xs: any) {
    return xs.length > 0 && xs[0].LNHeads.length > 0
  }

  function hasLnContext(xs: any, window: any) {
    for (const row of xs.slice(0, window)) {
      if (row.LNHeads.length || row.LNBodies.length || row.LNTails.length) return true
    }
    return false
  }

  function inverseReady(xs: any) {
    if (xs.length < 5) return false
    const win = xs.slice(0, 5)
    if (win.some((r) => r.NormalNotes.length > 0)) return false
    const maxBodies = Math.max(...win.map((r) => r.LNBodies.length))
    if (maxBodies < INVERSE_MIN_FILLED_LANES) return false

    const gaps: any[] = []
    for (let i = 0; i < win.length - 1; i += 1) {
      if (win[i].LNTails.length > 0 && win[i + 1].LNHeads.length > 0) {
        gaps.push(win[i + 1].Time - win[i].Time)
      }
    }
    if (gaps.length < 2) return false
    return Math.max(...gaps) - Math.min(...gaps) <= INVERSE_GAP_TOLERANCE_MS
  }

  export function CORE_STREAM(xs: any) {
    if (xs.length < 5) return 0
    const [a, b, c, d, e] = xs
    if (
      a.Notes === 1 &&
      a.Jacks === 0 &&
      b.Notes === 1 &&
      b.Jacks === 0 &&
      c.Notes === 1 &&
      c.Jacks === 0 &&
      d.Notes === 1 &&
      d.Jacks === 0 &&
      e.Notes === 1 &&
      e.Jacks === 0
    ) {
      if (a.RawNotes[0] !== e.RawNotes[0]) return 5
    }
    return 0
  }

  export function CORE_JACKS(xs: any) {
    if (!xs.length) return 0
    const x0 = xs[0]
    return x0.Jacks > 1 && x0.MsPerBeat < 2000 ? 1 : 0
  }

  export function CORE_CHORDSTREAM(xs: any) {
    if (xs.length < 4) return 0
    const [a, b, c, d] = xs
    if (a.Notes > 1 && a.Jacks === 0 && b.Jacks === 0 && c.Jacks === 0 && d.Jacks === 0) {
      if (b.Notes > 1 || c.Notes > 1 || d.Notes > 1) return 4
    }
    return 0
  }

  export function CORE_COORDINATION(xs: any) {
    if (!xs.length) return 0
    const a = xs[0]
    return a.LNHeads.length || a.LNBodies.length || a.LNTails.length ? 1 : 0
  }

  export function CORE_DENSITY(xs: any) {
    if (!xs.length) return 0
    return isLnHeadContext(xs) ? 1 : 0
  }

  export function CORE_WILDCARD(xs: any) {
    if (!xs.length) return 0
    return isLnHeadContext(xs) ? 1 : 0
  }

  function JACKS_CHORDJACKS(xs: any) {
    if (xs.length < 2) return 0
    const [a, b] = xs
    if (a.Notes > 2 && b.Notes > 1 && b.Jacks >= 1 && (b.Notes < a.Notes || b.Jacks < b.Notes)) {
      return 2
    }
    return 0
  }

  function JACKS_MINIJACKS(xs: any) {
    if (xs.length < 2) return 0
    const [a, b] = xs
    return a.Jacks > 0 && b.Jacks === 0 ? 2 : 0
  }

  function JACKS_LONGJACKS(xs: any) {
    if (xs.length < 5) return 0
    const [a, b, c, d, e] = xs
    if (a.Jacks > 0 && b.Jacks > 0 && c.Jacks > 0 && d.Jacks > 0 && e.Jacks > 0) {
      for (const x of a.RawNotes) {
        if (
          b.RawNotes.includes(x) &&
          c.RawNotes.includes(x) &&
          d.RawNotes.includes(x) &&
          e.RawNotes.includes(x)
        ) {
          return 5
        }
      }
    }
    return 0
  }

  function JACKS_4K_QUADSTREAM(xs: any) {
    if (xs.length < 4) return 0
    const [a, , c, d] = xs
    return a.Notes === 4 && c.Jacks === 0 && d.Jacks === 0 ? 4 : 0
  }

  function JACKS_4K_GLUTS(xs: any) {
    if (xs.length < 3) return 0
    const [a, b, c] = xs
    if (b.Jacks === 1 && c.Jacks === 1) {
      for (const x of a.RawNotes) {
        if (b.RawNotes.includes(x) && c.RawNotes.includes(x)) return 0
      }
      return 3
    }
    return 0
  }

  function CHORDSTREAM_4K_HANDSTREAM(xs: any) {
    if (xs.length < 4) return 0
    const [a, b, c, d] = xs
    return a.Notes === 3 && a.Jacks === 0 && b.Jacks === 0 && c.Jacks === 0 && d.Jacks === 0 ? 4 : 0
  }

  function CHORDSTREAM_4K_JUMPSTREAM(xs: any) {
    if (xs.length < 4) return 0
    const [a, b, c, d] = xs
    if (
      a.Notes === 2 &&
      a.Jacks === 0 &&
      b.Notes === 1 &&
      b.Jacks === 0 &&
      c.Jacks === 0 &&
      d.Jacks === 0
    ) {
      if (c.Notes < 3 && d.Notes < 3) return 4
    }
    return 0
  }

  function CHORDSTREAM_4K_JUMPTRILL(xs: any) {
    if (xs.length < 4) return 0
    const [a, b, c, d] = xs
    return a.Notes === 2 &&
      b.Notes === 2 &&
      c.Notes === 2 &&
      d.Notes === 2 &&
      b.Roll &&
      c.Roll &&
      d.Roll
      ? 4
      : 0
  }

  function CHORDSTREAM_4K_SPLITTRILL(xs: any) {
    if (xs.length < 3) return 0
    const [a, b, c] = xs
    return a.Notes === 2 &&
      b.Notes === 2 &&
      c.Notes === 2 &&
      b.Jacks === 0 &&
      c.Jacks === 0 &&
      !b.Roll &&
      !c.Roll
      ? 3
      : 0
  }

  function STREAM_4K_ROLL(xs: any) {
    if (xs.length < 3) return 0
    const [a, b, c] = xs
    if (a.Notes === 1 && b.Notes === 1 && c.Notes === 1) {
      const left =
        a.Direction === PatternPrimitives.Direction.LEFT &&
        b.Direction === PatternPrimitives.Direction.LEFT &&
        c.Direction === PatternPrimitives.Direction.LEFT
      const right =
        a.Direction === PatternPrimitives.Direction.RIGHT &&
        b.Direction === PatternPrimitives.Direction.RIGHT &&
        c.Direction === PatternPrimitives.Direction.RIGHT
      if (left || right) return 3
    }
    return 0
  }

  function STREAM_4K_TRILL(xs: any) {
    if (xs.length < 4) return 0
    const [a, b, c, d] = xs
    if (b.Jacks === 0 && c.Jacks === 0 && d.Jacks === 0) {
      if (String(a.RawNotes) === String(c.RawNotes) && String(b.RawNotes) === String(d.RawNotes))
        return 4
    }
    return 0
  }

  function STREAM_4K_MINITRILL(xs: any) {
    if (xs.length < 4) return 0
    const [a, b, c, d] = xs
    if (b.Jacks === 0 && c.Jacks === 0) {
      if (String(a.RawNotes) === String(c.RawNotes) && String(b.RawNotes) !== String(d.RawNotes))
        return 4
    }
    return 0
  }

  function CHORDSTREAM_7K_DOUBLE_STREAMS(xs: any) {
    if (xs.length < 2) return 0
    const [a, b] = xs
    return a.Notes === 2 && b.Notes === 2 && b.Jacks === 0 && !b.Roll ? 2 : 0
  }

  function CHORDSTREAM_7K_DENSE_CHORDSTREAM(xs: any) {
    if (xs.length < 2) return 0
    const [a, b] = xs
    return a.Notes > 1 && b.Notes > 1 && b.Jacks === 0 ? 2 : 0
  }

  function CHORDSTREAM_7K_LIGHT_CHORDSTREAM(xs: any) {
    if (xs.length < 2) return 0
    const [a, b] = xs
    return a.Notes > 1 && b.Notes === 1 && b.Jacks === 0 ? 2 : 0
  }

  function CHORDSTREAM_7K_CHORD_ROLL(xs: any) {
    if (xs.length < 3) return 0
    const [a, b, c] = xs
    if (a.Notes > 1 && b.Notes > 1 && c.Notes > 1 && b.Roll && c.Roll) {
      if (
        (b.Direction === PatternPrimitives.Direction.LEFT &&
          c.Direction === PatternPrimitives.Direction.LEFT) ||
        (b.Direction === PatternPrimitives.Direction.RIGHT &&
          c.Direction === PatternPrimitives.Direction.RIGHT)
      ) {
        return 3
      }
    }
    return 0
  }

  function CHORDSTREAM_7K_BRACKETS(xs: any) {
    if (xs.length < 3) return 0
    const [a, b, c] = xs
    if (
      a.Notes > 2 &&
      b.Notes > 2 &&
      c.Notes > 2 &&
      !b.Roll &&
      !c.Roll &&
      b.Jacks === 0 &&
      c.Jacks === 0
    ) {
      if (a.Notes + b.Notes + c.Notes > 9) return 3
    }
    return 0
  }

  const CHORDSTREAM_OTHER_DOUBLE_STREAMS = CHORDSTREAM_7K_DOUBLE_STREAMS
  const CHORDSTREAM_OTHER_DENSE_CHORDSTREAM = CHORDSTREAM_7K_DENSE_CHORDSTREAM
  const CHORDSTREAM_OTHER_LIGHT_CHORDSTREAM = CHORDSTREAM_7K_LIGHT_CHORDSTREAM
  const CHORDSTREAM_OTHER_CHORD_ROLL = CHORDSTREAM_7K_CHORD_ROLL

  export function COORDINATION_COLUMN_LOCK(xs: any) {
    if (xs.length < 3) return 0
    const split = xs[0].LeftHandKeys
    const lnCol = xs[0].LNHeads.length ? xs[0].LNHeads[0] : null
    if (lnCol == null) return 0

    const adjCols = [lnCol - 1, lnCol + 1].filter(
      (c) => c >= 0 && c < xs[0].Keys && isSameHandAdjacent(lnCol, c, split)
    )
    if (!adjCols.length) return 0

    for (const adj of adjCols) {
      const hits: any[] = []
      for (const row of xs.slice(0, 8)) {
        if (row.LNBodies.includes(lnCol) && row.NormalNotes.includes(adj)) {
          hits.push(row.Time)
        }
      }
      if (hits.length < 3) continue

      const bpms: any[] = []
      for (let i = 0; i < hits.length - 1; i += 1) {
        bpms.push(jackBpm(hits[i + 1] - hits[i]))
      }
      if (bpms.length && Math.max(...bpms) >= JACKY_MIN_BPM) return 3
    }

    return 0
  }

  function COORDINATION_SHIELD(xs: any) {
    if (xs.length < 2) return 0
    const [a, b] = xs
    const dt = b.Time - a.Time
    const beatLimit = b.BeatLength * SHIELD_MAX_BEAT_RATIO
    if (dt < 0 || dt > beatLimit) return 0

    for (const col of a.NormalNotes) {
      if (b.LNHeads.includes(col)) return 2
    }
    for (const col of a.LNTails) {
      if (b.NormalNotes.includes(col)) return 2
    }
    return 0
  }

  function COORDINATION_RELEASE(xs: any) {
    if (xs.length < RELEASE_MIN_TAIL_ROWS) return 0
    if (COORDINATION_SHIELD(xs) !== 0) return 0
    if (inverseReady(xs)) return 0
    if (WILDCARD_JACK(xs) !== 0) return 0

    const pickedRows = xs.slice(0, RELEASE_SCAN_ROWS).filter((r) => r.LNTails.length === 1)
    if (pickedRows.length < RELEASE_MIN_TAIL_ROWS) return 0

    const useRows = Math.min(RELEASE_FULL_MATCH_ROWS, pickedRows.length)
    const tails = pickedRows.slice(0, useRows).map((r) => r.LNTails[0])

    let prev: any = [tails[0]]
    const rows: any[] = []
    for (let i = 0; i < useRows; i += 1) {
      const row = pickedRows[i]
      const cur = [tails[i]]
      const [direction, roll] = PatternPrimitives.detectDirection(prev, cur)
      rows.push({
        Index: row.Index,
        Time: row.Time,
        MsPerBeat: row.MsPerBeat,
        BeatLength: row.BeatLength,
        Notes: 1,
        Jacks: cur[0] === prev[0] ? 1 : 0,
        Direction: direction,
        Roll: roll,
        Keys: row.Keys,
        LeftHandKeys: row.LeftHandKeys,
        LNHeads: row.LNHeads,
        LNBodies: row.LNBodies,
        LNTails: row.LNTails,
        NormalNotes: [],
        RawNotes: cur
      })
      prev = cur
    }

    const effectiveRows = rows.length > 1 ? rows.slice(1) : []
    if (effectiveRows.length < RELEASE_ROLL_POINTS) return 0

    let matched = false
    if (RELEASE_ROLL_POINTS >= 3) {
      matched = STREAM_4K_ROLL(effectiveRows.slice(0, RELEASE_ROLL_POINTS)) !== 0
    } else {
      const a = effectiveRows[0].RawNotes[0]
      const b = effectiveRows[1] ? effectiveRows[1].RawNotes[0] : a
      const dt = effectiveRows[1] ? effectiveRows[1].Time - effectiveRows[0].Time : 0
      matched = a !== b && dt > 0
    }

    if (matched) {
      return useRows >= RELEASE_FULL_MATCH_ROWS ? 5 : 4
    }
    return 0
  }

  function DENSITY_4K_JUMPSTREAM(xs: any) {
    if (xs.length < 4 || !isLnHeadContext(xs)) return 0
    return CHORDSTREAM_4K_JUMPSTREAM(headRows(xs, 4)) !== 0 ? 4 : 0
  }

  function DENSITY_4K_HANDSTREAM(xs: any) {
    if (xs.length < 4 || !isLnHeadContext(xs)) return 0
    return CHORDSTREAM_4K_HANDSTREAM(headRows(xs, 4)) !== 0 ? 4 : 0
  }

  function DENSITY_4K_INVERSE(xs: any) {
    return inverseReady(xs) ? 5 : 0
  }

  function DENSITY_7K_DOUBLE_STREAMS(xs: any) {
    if (xs.length < 2 || !isLnHeadContext(xs)) return 0
    return CHORDSTREAM_7K_DOUBLE_STREAMS(headRows(xs, 2)) !== 0 ? 2 : 0
  }

  function DENSITY_7K_DENSE_CHORDSTREAM(xs: any) {
    if (xs.length < 2 || !isLnHeadContext(xs)) return 0
    return CHORDSTREAM_7K_DENSE_CHORDSTREAM(headRows(xs, 2)) !== 0 ? 2 : 0
  }

  function DENSITY_7K_LIGHT_CHORDSTREAM(xs: any) {
    if (xs.length < 2 || !isLnHeadContext(xs)) return 0
    return CHORDSTREAM_7K_LIGHT_CHORDSTREAM(headRows(xs, 2)) !== 0 ? 2 : 0
  }

  const DENSITY_7K_INVERSE = DENSITY_4K_INVERSE
  const DENSITY_OTHER_DOUBLE_STREAMS = DENSITY_7K_DOUBLE_STREAMS
  const DENSITY_OTHER_DENSE_CHORDSTREAM = DENSITY_7K_DENSE_CHORDSTREAM
  const DENSITY_OTHER_LIGHT_CHORDSTREAM = DENSITY_7K_LIGHT_CHORDSTREAM
  const DENSITY_OTHER_INVERSE = DENSITY_7K_INVERSE

  export function WILDCARD_JACK(xs: any) {
    if (xs.length < 2 || !hasLnContext(xs, JACKY_CONTEXT_WINDOW)) return 0

    const rows = xs.slice(0, Math.max(4, JACKY_CONTEXT_WINDOW)).filter((r) => r.Notes > 0)
    if (rows.length < 2) return 0

    if (JACKS_CHORDJACKS(rows) !== 0 || JACKS_MINIJACKS(rows) !== 0) return 4

    const checkRows = rows.slice(0, Math.min(4, rows.length))
    const jackRows = checkRows.filter((r) => r.Jacks > 0).length
    if (jackRows >= 2 && checkRows.some((r) => r.Notes >= 2)) return 3

    const fastestMspb = Math.min(...checkRows.map((r) => r.MsPerBeat))
    if (jackRows >= 2 && fastestMspb <= JACKY_FALLBACK_MAX_MSPB) return 3
    return 0
  }

  function WILDCARD_SPEED(xs: any) {
    if (xs.length < 2 || !hasLnContext(xs, 4)) return 0

    const rows = headRows(xs, Math.min(4, xs.length))
    if (xs[0].Keys === 4) {
      if (rows.length >= 3 && STREAM_4K_ROLL(rows.slice(0, 3)) !== 0) return 3
      if (rows.length >= 2) {
        const sameDir =
          (rows[0].Direction === PatternPrimitives.Direction.LEFT ||
            rows[0].Direction === PatternPrimitives.Direction.RIGHT) &&
          rows[0].Direction === rows[1].Direction
        if (sameDir || rows[0].MsPerBeat <= 180) return 3
      }
    } else {
      if (rows.length >= 3 && CHORDSTREAM_7K_CHORD_ROLL(rows.slice(0, 3)) !== 0) return 3
      if (rows.length >= 2) {
        const cond =
          rows[0].Notes >= 2 &&
          rows[1].Notes >= 2 &&
          rows[0].Direction === rows[1].Direction &&
          (rows[0].Direction === PatternPrimitives.Direction.LEFT ||
            rows[0].Direction === PatternPrimitives.Direction.RIGHT)
        if (cond || rows[0].MsPerBeat <= 170) return 3
      }
    }
    return 0
  }

  function makeSpecificPatterns(
    stream: any,
    chordstream: any,
    jack: any,
    coordination: any,
    density: any,
    wildcard: any
  ) {
    return {
      Stream: stream,
      Chordstream: chordstream,
      Jack: jack,
      Coordination: coordination,
      Density: density,
      Wildcard: wildcard
    }
  }

  export function SPECIFIC_4K() {
    const coordination = reorderSpecific(
      [
        ['Column Lock', COORDINATION_COLUMN_LOCK],
        ['Release', COORDINATION_RELEASE],
        ['Shield', COORDINATION_SHIELD]
      ],
      COORDINATION_SPECIFIC_ORDER
    )

    const density = reorderSpecific(
      [
        ['JS Density', DENSITY_4K_JUMPSTREAM],
        ['HS Density', DENSITY_4K_HANDSTREAM],
        ['Inverse', DENSITY_4K_INVERSE]
      ],
      DENSITY_SPECIFIC_ORDER
    )

    const wildcard = reorderSpecific(
      [
        ['Jacky WC', WILDCARD_JACK],
        ['Speedy WC', WILDCARD_SPEED]
      ],
      WILDCARD_SPECIFIC_ORDER
    )

    return makeSpecificPatterns(
      [
        ['Rolls', STREAM_4K_ROLL],
        ['Trills', STREAM_4K_TRILL],
        ['Minitrills', STREAM_4K_MINITRILL]
      ],
      [
        ['Handstream', CHORDSTREAM_4K_HANDSTREAM],
        ['Split Trill', CHORDSTREAM_4K_SPLITTRILL],
        ['Jumptrill', CHORDSTREAM_4K_JUMPTRILL],
        ['Jumpstream', CHORDSTREAM_4K_JUMPSTREAM]
      ],
      [
        ['Longjacks', JACKS_LONGJACKS],
        ['Quadstream', JACKS_4K_QUADSTREAM],
        ['Gluts', JACKS_4K_GLUTS],
        ['Chordjacks', JACKS_CHORDJACKS],
        ['Minijacks', JACKS_MINIJACKS]
      ],
      coordination,
      density,
      wildcard
    )
  }

  export function SPECIFIC_7K() {
    const coordination = reorderSpecific(
      [
        ['Column Lock', COORDINATION_COLUMN_LOCK],
        ['Release', COORDINATION_RELEASE],
        ['Shield', COORDINATION_SHIELD]
      ],
      COORDINATION_SPECIFIC_ORDER
    )

    const density = reorderSpecific(
      [
        ['DS Density', DENSITY_7K_DOUBLE_STREAMS],
        ['DCS Density', DENSITY_7K_DENSE_CHORDSTREAM],
        ['LCS Density', DENSITY_7K_LIGHT_CHORDSTREAM],
        ['Inverse', DENSITY_7K_INVERSE]
      ],
      DENSITY_SPECIFIC_ORDER
    )

    const wildcard = reorderSpecific(
      [
        ['Jacky WC', WILDCARD_JACK],
        ['Speedy WC', WILDCARD_SPEED]
      ],
      WILDCARD_SPECIFIC_ORDER
    )

    return makeSpecificPatterns(
      [],
      [
        ['Brackets', CHORDSTREAM_7K_BRACKETS],
        ['Double Stream', CHORDSTREAM_7K_DOUBLE_STREAMS],
        ['Dense Chordstream', CHORDSTREAM_7K_DENSE_CHORDSTREAM],
        ['Light Chordstream', CHORDSTREAM_7K_LIGHT_CHORDSTREAM]
      ],
      [
        ['Longjacks', JACKS_LONGJACKS],
        ['Chordjacks', JACKS_CHORDJACKS],
        ['Minijacks', JACKS_MINIJACKS]
      ],
      coordination,
      density,
      wildcard
    )
  }

  export function SPECIFIC_OTHER() {
    const coordination = reorderSpecific(
      [
        ['Column Lock', COORDINATION_COLUMN_LOCK],
        ['Release', COORDINATION_RELEASE],
        ['Shield', COORDINATION_SHIELD]
      ],
      COORDINATION_SPECIFIC_ORDER
    )

    const density = reorderSpecific(
      [
        ['DS Density', DENSITY_OTHER_DOUBLE_STREAMS],
        ['DCS Density', DENSITY_OTHER_DENSE_CHORDSTREAM],
        ['LCS Density', DENSITY_OTHER_LIGHT_CHORDSTREAM],
        ['Inverse', DENSITY_OTHER_INVERSE]
      ],
      DENSITY_SPECIFIC_ORDER
    )

    const wildcard = reorderSpecific(
      [
        ['Jacky WC', WILDCARD_JACK],
        ['Speedy WC', WILDCARD_SPEED]
      ],
      WILDCARD_SPECIFIC_ORDER
    )

    return makeSpecificPatterns(
      [],
      [
        ['Chord Rolls', CHORDSTREAM_OTHER_CHORD_ROLL],
        ['Double Stream', CHORDSTREAM_OTHER_DOUBLE_STREAMS],
        ['Dense Chordstream', CHORDSTREAM_OTHER_DENSE_CHORDSTREAM],
        ['Light Chordstream', CHORDSTREAM_OTHER_LIGHT_CHORDSTREAM]
      ],
      [
        ['Longjacks', JACKS_LONGJACKS],
        ['Chordjacks', JACKS_CHORDJACKS],
        ['Minijacks', JACKS_MINIJACKS]
      ],
      coordination,
      density,
      wildcard
    )
  }
}
