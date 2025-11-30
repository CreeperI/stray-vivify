// --- 辅助函数 ---
import { ChartTypeV2 } from '@preload/types'
import { FrameRate } from '@renderer/core/frame-rates'

export function calculateChartStats(
  diff: ChartTypeV2.diff,
  songLengthMs: number // ← 替代 chart.length
): ChartTypeV2.SongStats {
  FrameRate.calc_sr.start()
  // Step 1: 统计基础数据
  let normalNotes = 0 // 普通单点（snm=0, width=1）
  let bumpers = 0 // 普通双押（snm=0, width=2）
  let sBumpers = 0 // S-Bumper（snm=2, width=2）
  let bombs = 0 // Mine（snm=1）
  let holdNotes = 0 // 长条起始点（含宽/窄）
  let holdPieces = 0 // 长条中间分段数
  let multiNoteCount = 0 // 同一时间点多个 note（不包括长条内部）
  let noteCount = 0 // 总 note 数（含长条起点和分段）

  // 先收集所有非长条的 note 时间点，用于检测 multi
  const nonHoldNotes: { time: number; laneStart: number; width: number }[] = []
  const allNotesNoHold: { lane: number; time: number }[] = []

  for (const note of diff.notes) {
    if ('len' in note) {
      // === Hold Note ===
      holdNotes++
      noteCount += 2 // 起点 + 至少一个分段（GML 逻辑）

      // 收集非长条部分（仅起点）
      allNotesNoHold.push({ lane: note.lane, time: note.time })
      nonHoldNotes.push({ time: note.time, laneStart: note.lane, width: note.width })

      // 计算 holdPieces（参考 GML 逻辑）
      const msPerNote = getMsPerNoteAtTime(diff.timing, note.time)
      const noteDurationMs = note.len - msPerNote
      if (noteDurationMs > 0) {
        const notesInHold = noteDurationMs / msPerNote
        const parts = Math.ceil(notesInHold)
        // 分段只在 >= 150ms 后才计（GML: partMs <= arg2 - 150）
        let validParts = 0
        for (let i = 1; i <= parts; i++) {
          const partMs = note.time + i * msPerNote
          if (partMs <= note.time + note.len - 150) {
            validParts++
          }
        }
        holdPieces += validParts
        noteCount += validParts
      }
    } else {
      // === Normal / Bumper / Bomb / S-Bumper ===
      if (note.snm === 1) {
        bombs++
      } else if (note.snm === 2) {
        sBumpers++
        bumpers++ // S-Bumper 也计入 bumper 总数
      } else {
        if (note.width === 1) {
          normalNotes++
        } else {
          bumpers++
        }
      }
      noteCount++
      allNotesNoHold.push({ lane: note.lane, time: note.time })
      nonHoldNotes.push({ time: note.time, laneStart: note.lane, width: note.width })
    }
  }

  // Step 2: 检测 Multi Notes（同一时间点多个事件）
  const timeMap = new Map<number, Set<number>>() // time -> set of occupied lanes
  for (const { time, laneStart, width } of nonHoldNotes) {
    if (!timeMap.has(time)) timeMap.set(time, new Set())
    const lanes = timeMap.get(time)!
    for (let i = 0; i < width && laneStart + i < 4; i++) {
      lanes.add(laneStart + i)
    }
  }
  for (const lanes of timeMap.values()) {
    if (lanes.size > 1) {
      multiNoteCount += lanes.size
    }
  }

  // Step 3: 密度统计（使用 1000ms 滑动窗口）
  const peakDensity = calculatePeakDensity(diff.notes)

  // Step 4: Jack & Chain 统计
  const jackStat = calculateJackStat(allNotesNoHold)
  const chainStat = calculateChainStat(allNotesNoHold)

  // Step 5: 衍生数值
  const combo = noteCount
  const notesNoPiece = combo - holdPieces
  const length = songLengthMs / 1000 // 转为秒，与 GML 一致

  // 主 BPM（取最长 timing 段的 BPM）
  let maxSegmentLength = 0
  for (let i = 0; i < diff.timing.length; i++) {
    const start = diff.timing[i].time
    const end = i === diff.timing.length - 1 ? songLengthMs : diff.timing[i + 1].time
    const segLen = end - start
    if (segLen > maxSegmentLength) {
      maxSegmentLength = segLen
    }
  }

  const averageDensity = notesNoPiece / length

  // Step 6: 核心 stat 计算（完全复刻 GML 公式）
  const basePower =
    (((notesNoPiece + averageDensity + multiNoteCount * 0.75) / (length / 3)) * 4) / 1.25
  const noteStat = Math.pow(
    Math.max((normalNotes / 1.5 - multiNoteCount / 2.5) / (length / 20) + basePower - 20, 0),
    1.025
  )
  const speedStat = Math.pow(
    Math.max(0, averageDensity * 5 + basePower / 2 - Math.min(multiNoteCount, 300) / 10 - 40),
    1.025
  )
  const t1 = (bumpers / 2 + holdNotes / 2) / (length / 20)
  const t2 = (jackStat / 2300 + chainStat / 2300 - Math.max(0, (length - 180) / 2.5)) / 1.5
  const techStat = Math.pow(Math.max(0, t1 + basePower + t2 - 20), 1.025)
  const fillStat = peakDensity * 4 - 30
  const multiStat = Math.pow(Math.max(0, multiNoteCount / 1.5 / (length / 20) + basePower), 1.025)

  // Step 7: 总分（固定使用 FINALE 难度倍率 diffMult = 2）
  const totalV2 = noteStat + speedStat + techStat + multiStat * 0.33 + fillStat * 0.5
  const totalV3 = Math.pow(
    noteStat * 0.8 + techStat * 0.8 + speedStat + multiStat * 0.5 + fillStat * 0.5,
    1
  )

  FrameRate.calc_sr.end()
  return {
    note: noteStat,
    speed: speedStat,
    tech: techStat,
    fill: fillStat,
    multi: multiStat,
    total_v2: totalV2,
    total_v3: totalV3
  }
}

// --- 辅助函数（保持不变）---
function getMsPerNoteAtTime(timing: ChartTypeV2.timing[], time: number): number {
  const tp = timing.findLast?.((t) => t.time <= time) ?? timing[0]
  return 60000 / tp.bpm // 每拍毫秒数（假设 4/4 拍）
}

function calculatePeakDensity(notes: ChartTypeV2.note[]): number {
  const windowSize = 1000
  let peak = 0
  const times = notes.map((n) => n.time).sort((a, b) => a - b)
  if (times.length === 0) return 0
  let left = 0
  for (let right = 0; right < times.length; right++) {
    while (times[right] - times[left] >= windowSize) left++
    peak = Math.max(peak, right - left + 1)
  }
  return peak
}

function calculateJackStat(notes: { lane: number; time: number }[]): number {
  let jackStat = 0
  notes.sort((a, b) => a.time - b.time)
  for (let i = 0; i < notes.length - 1; i++) {
    if (notes[i].lane === notes[i + 1].lane && notes[i].lane < 4) {
      const dt = notes[i + 1].time - notes[i].time
      if (dt < 1000) {
        jackStat += 1000 - dt
      }
    }
  }
  return jackStat
}

function calculateChainStat(notes: { lane: number; time: number }[]): number {
  let chainStat = 0
  notes.sort((a, b) => a.time - b.time)
  for (let i = 0; i < notes.length - 1; i++) {
    const lane = notes[i].lane
    if (lane < 4) {
      if ((lane === 0 || lane === 1) && notes[i + 1].lane === 4) {
        const dt = notes[i + 1].time - notes[i].time
        if (dt < 1000) chainStat += 1000 - dt
      }
      if ((lane === 2 || lane === 3) && notes[i + 1].lane === 6) {
        const dt = notes[i + 1].time - notes[i].time
        if (dt < 1000) chainStat += 1000 - dt
      }
    }
  }
  return chainStat
}
