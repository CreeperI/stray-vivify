import { Rework_Types } from './types'

/**
 * MMA 展示层（`js/app/display.js` 的配色/文本工具 + `config.js` 的 starStops）的移植。
 *
 * 与原实现的差别：原函数直接写 DOM（这里不写），只保留纯计算部分：
 * 星数配色、可读文字色、键型子类型文本、难度标签 → 星星点等级、簇合并、进度条数据。
 */
export namespace Rework_Display {
  /** config.js: APP_CONFIG.starStops.background */
  const STAR_BG_STOPS: [number, string][] = [
    [0.0, '#aaaaaa'],
    [0.9, '#4bb3fd'],
    [2.0, '#4fffd5'],
    [3.0, '#d3f557'],
    [4.0, '#fda265'],
    [5.0, '#f94d79'],
    [6.0, '#b64cc1'],
    [7.0, '#5654ca'],
    [8.0, '#14117d'],
    [9.0, '#000000'],
    [9999.9, '#000000']
  ]

  /** config.js: APP_CONFIG.starStops.text */
  const STAR_TEXT_STOPS: [number, string][] = [
    [0.0, '#000000'],
    [6.49, '#000000'],
    [6.5, '#ffd966'],
    [8.9, '#ffd966'],
    [9.0, '#f6f05c'],
    [10.0, '#ff7a69'],
    [11.0, '#e74a95'],
    [12.0, '#9a57ce'],
    [12.39, '#6563de'],
    [9999.9, '#6563de']
  ]

  function hexToRgb(hex: string) {
    const h = hex.replace('#', '')
    const full =
      h.length === 3
        ? h
            .split('')
            .map((ch) => ch + ch)
            .join('')
        : h
    const int = Number.parseInt(full, 16)
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255
    }
  }

  function rgbToHex(r: number, g: number, b: number) {
    const toHex = (v: number) => v.toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  function interpolateColor(hexA: string, hexB: string, t: number) {
    const a = hexToRgb(hexA)
    const b = hexToRgb(hexB)
    const r = Math.round(a.r + (b.r - a.r) * t)
    const g = Math.round(a.g + (b.g - a.g) * t)
    const bch = Math.round(a.b + (b.b - a.b) * t)
    return rgbToHex(r, g, bch)
  }

  export function starColorFor(starValue: number) {
    if (!Number.isFinite(starValue)) return '#6d7894'

    if (starValue <= STAR_BG_STOPS[0][0]) {
      return STAR_BG_STOPS[0][1]
    }

    for (let i = 0; i < STAR_BG_STOPS.length - 1; i += 1) {
      const [lVal, lColor] = STAR_BG_STOPS[i]
      const [rVal, rColor] = STAR_BG_STOPS[i + 1]
      if (starValue >= lVal && starValue <= rVal) {
        const t = (starValue - lVal) / (rVal - lVal || 1)
        return interpolateColor(lColor, rColor, t)
      }
    }

    return STAR_BG_STOPS[STAR_BG_STOPS.length - 1][1]
  }

  export function starTextColorFor(starValue: number) {
    if (!Number.isFinite(starValue)) return '#f6fbff'

    if (starValue <= STAR_TEXT_STOPS[0][0]) {
      return STAR_TEXT_STOPS[0][1]
    }

    for (let i = 0; i < STAR_TEXT_STOPS.length - 1; i += 1) {
      const [lVal, lColor] = STAR_TEXT_STOPS[i]
      const [rVal, rColor] = STAR_TEXT_STOPS[i + 1]
      if (starValue >= lVal && starValue <= rVal) {
        const t = (starValue - lVal) / (rVal - lVal || 1)
        return interpolateColor(lColor, rColor, t)
      }
    }

    return STAR_TEXT_STOPS[STAR_TEXT_STOPS.length - 1][1]
  }

  function relativeLuminance(hexColor: string) {
    const { r, g, b } = hexToRgb(hexColor)
    const convert = (v: number) => {
      const c = v / 255
      if (c <= 0.03928) {
        return c / 12.92
      }
      return ((c + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b)
  }

  function contrastRatio(hexA: string, hexB: string) {
    const l1 = relativeLuminance(hexA)
    const l2 = relativeLuminance(hexB)
    const bright = Math.max(l1, l2)
    const dark = Math.min(l1, l2)
    return (bright + 0.05) / (dark + 0.05)
  }

  export function pickReadableTextColor(
    starValue: number,
    bgColor: string,
    preferredColor?: string
  ) {
    if (Number.isFinite(starValue) && starValue > 12) {
      return '#6563de'
    }

    if (Number.isFinite(starValue) && starValue >= 6.0 && starValue < 6.5) {
      return '#000000'
    }

    if (Number.isFinite(starValue) && starValue >= 6.5 && starValue <= 8.9) {
      return '#ffd966'
    }

    const preferred = preferredColor || '#f6fbff'
    if (contrastRatio(bgColor, preferred) >= 4.5) {
      return preferred
    }

    const candidateDark = '#111111'
    const candidateLight = '#f6fbff'
    const candidateGold = '#FFD966'

    const darkRatio = contrastRatio(bgColor, candidateDark)
    const lightRatio = contrastRatio(bgColor, candidateLight)
    const goldRatio = contrastRatio(bgColor, candidateGold)

    if (starValue >= 7.0 && starValue <= 10.0) {
      if (goldRatio >= 4.5) return candidateGold
      if (lightRatio >= darkRatio) return candidateLight
      return candidateDark
    }

    if (darkRatio >= 4.5 || darkRatio > lightRatio) {
      return candidateDark
    }
    return candidateLight
  }

  /** display.js: formatClusterSpecificTypes */
  function formatClusterSpecificTypes(specificTypes: [string, number][] | undefined) {
    if (!specificTypes || !specificTypes.length) {
      return '-'
    }

    return specificTypes.map(([name, ratio]) => `${name} (${(ratio * 100).toFixed(1)}%)`).join(', ')
  }

  /** display.js: RC_SUFFIX_LEVELS / RC_SUFFIX_ORDER / parseRcDifficultyLevel */
  const RC_SUFFIX_LEVELS: Record<string, number> = {
    low: 1,
    'mid/low': 2,
    mid: 3,
    'mid/high': 4,
    high: 5
  }

  const RC_SUFFIX_ORDER = Object.keys(RC_SUFFIX_LEVELS).sort((a, b) => b.length - a.length)

  export function parseRcDifficultyLevel(diffText: string | undefined) {
    if (!diffText || diffText === '-') {
      return 0
    }

    const rcPart = diffText.split('\n')[0].trim().toLowerCase()
    if (!rcPart) {
      return 0
    }

    for (const suffix of RC_SUFFIX_ORDER) {
      if (rcPart.endsWith(suffix)) {
        return RC_SUFFIX_LEVELS[suffix]
      }
    }

    return 0
  }

  /** display.js: formatDiffForDisplay */
  export function formatDiffForDisplay(diffText: unknown) {
    if (!diffText) {
      return '-'
    }
    return String(diffText)
      .split('||')
      .map((part) => part.trim())
      .join('\n')
  }

  /** display.js: mergeDuplicateClusters（按 Pattern 合并同型簇） */
  export function mergeDuplicateClusters(clusters: Rework_Types.Cluster[]): any[] {
    const mergedMap = new Map<string, any>()

    for (const cluster of clusters) {
      const key = cluster.Pattern
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          Pattern: cluster.Pattern,
          Amount: 0,
          BPM: cluster.BPM,
          SpecificTypes: new Map<string, number>()
        })
      }

      const merged = mergedMap.get(key)
      merged.Amount += Number(cluster.Amount) || 0
      merged.BPM = Math.max(Number(merged.BPM) || 0, Number(cluster.BPM) || 0)

      const specificTypes = Array.isArray(cluster.SpecificTypes) ? cluster.SpecificTypes : []
      for (const [name, ratio] of specificTypes) {
        const weighted = (Number(ratio) || 0) * (Number(cluster.Amount) || 0)
        merged.SpecificTypes.set(name, (merged.SpecificTypes.get(name) || 0) + weighted)
      }
    }

    return [...mergedMap.values()].map((item) => {
      const total = item.Amount > 0 ? item.Amount : 1
      const normalizedSpecific = [...item.SpecificTypes.entries()]
        .map(([name, weighted]) => [name, (weighted as number) / total])
        .sort((a, b) => (b[1] as number) - (a[1] as number))
      return {
        Pattern: item.Pattern,
        Amount: item.Amount,
        BPM: item.BPM,
        SpecificTypes: normalizedSpecific
      }
    })
  }

  /**
   * display.js: buildPatternItemData（宽度按 Amount 相对最大值）
   * @param padToFive MMA 原版会补空条到 5 条；本项目传 false —— 有几个画几个（最多 5 条）
   */
  export function buildPatternItemData(
    clusters: any[],
    padToFive = true
  ): Rework_Types.PatternBarItem[] {
    const topFive = [...(clusters || [])].slice(0, 5)
    const maxAmount = Math.max(...topFive.map((cluster) => Number(cluster?.Amount) || 0), 1)

    if (padToFive) {
      while (topFive.length < 5) {
        topFive.push(null as any)
      }
    }

    return topFive.map((cluster) => {
      if (!cluster) {
        return { empty: true, label: '-', subtype: '-', width: '0' }
      }
      const ratio = Math.max(0, Math.min((cluster.Amount / maxAmount) * 100, 100))
      return {
        empty: false,
        label: cluster.Pattern,
        subtype: formatClusterSpecificTypes(cluster.SpecificTypes),
        width: ratio.toFixed(2)
      }
    })
  }
}
