import { ChartTypeV2 } from '@preload/chart-types'

/**
 * diff → 单键音符表。
 *
 * 行为规范与已删除的 `calc-stat.ts: parse_diff_to_om` 逐行对齐：
 *   - width > 1 的音符摊平为「第一个空闲列」（只考虑 LN 占位）；
 *   - snm === 1（炸弹）丢弃；snm === 2（S/bumper）按普通音符处理；
 *   - LN 输出 `{ time, lane, end }`；
 *   - 事件按 time 升序，同一时间点按 `end < note < ln` 优先级（保证 [time, end) 严格占用）。
 *
 * 本模块为纯函数（不读 Storage / Vue / DOM），因此可以在 Worker 中直接使用。
 */
export namespace Rework_DiffNotes {
  export type Note = {
    time: number
    lane: number
    /** 仅 LN 有：结束时间 */
    end?: number
  }

  export type Source = {
    /** 键数（= max_lane） */
    keys: number
    /** 单键音符（已摊平 width、已丢弃炸弹） */
    notes: Note[]
    /** 原始 timing（BPM 段） */
    timing: ChartTypeV2.timing[]
  }

  export type Options = {
    /**
     * 键数下限。等价于 `Chart_diff.calc_max_lane` 里的 `Storage.settings.min_lane`
     * （默认 4），此处不读 Storage，保持本模块纯净。
     */
    minLane?: number
  }

  function resolveMaxLane(diff: ChartTypeV2.diff, minLane = 4): number {
    if (diff?.override?.max_lane) {
      return diff.override.max_lane
    }
    let max = minLane
    const n = diff.notes
    for (let i = 0; i < n.length; i++) {
      max = Math.max(n[i].lane + n[i].width, max)
    }
    return max
  }

  type Event =
    | { kind: 'note'; time: number; data: ChartTypeV2.note }
    | { kind: 'ln'; time: number; end: number; data: ChartTypeV2.note }
    | { kind: 'end'; time: number; lane: number }

  const EVENT_PRIORITY: Record<Event['kind'], number> = { end: 0, note: 1, ln: 2 }

  export function fromDiff(diff: ChartTypeV2.diff, options: Options = {}): Source {
    const keys = resolveMaxLane(diff, options.minLane ?? 4)

    const notes = diff.notes.slice()
    notes.sort((a, b) => a.time - b.time)

    const resultNotes: Note[] = []
    const flag = new Array<boolean>(keys).fill(false)

    const events: Event[] = []

    for (const note of notes) {
      if ('snm' in note && note.snm === 1) continue

      if ('len' in note) {
        const end = note.time + note.len

        events.push({ kind: 'ln', time: note.time, end, data: note })
        events.push({ kind: 'end', time: end, lane: note.lane })
      } else {
        events.push({ kind: 'note', time: note.time, data: note })
      }
    }

    events.sort((a, b) => {
      if (a.time !== b.time) return a.time - b.time
      return EVENT_PRIORITY[a.kind] - EVENT_PRIORITY[b.kind]
    })

    const lastWide: number[] = new Array(keys).fill(-Infinity)

    // main parse loop
    for (const event of events) {
      if (event.kind === 'end') {
        flag[event.lane] = false
        continue
      }

      if (event.kind === 'note') {
        const note = event.data

        if (note.width === 1) {
          resultNotes.push({ time: note.time, lane: note.lane })
        } else {
          const rightmost = Math.min(note.lane + note.width - 1, keys - 1)
          let targetLane = note.lane

          const possibleLanes: number[] = []
          for (let lane = note.lane; lane < rightmost; lane++) {
            if (!flag[lane]) {
              possibleLanes.push(lane)
            }
          }
          targetLane = possibleLanes.length ? possibleLanes[0] : note.lane
          if (possibleLanes.length) {
            // if possible lane.
            // from left to right, choose the farthest time and leftmost lane.
            for (const possibleLane of possibleLanes) {
              if (lastWide[possibleLane] > lastWide[targetLane]) {
                targetLane = possibleLane
              }
            }
          }
          lastWide[targetLane] = note.time

          resultNotes.push({ time: note.time, lane: targetLane })
        }
      } else {
        const note = event.data
        const end = event.end

        if (note.width === 1) {
          resultNotes.push({ time: note.time, lane: note.lane, end })
          flag[note.lane] = true
        } else {
          const rightmost = Math.min(note.lane + note.width - 1, keys - 1)
          let targetLane = note.lane

          for (let lane = note.lane; lane <= rightmost; lane++) {
            if (!flag[lane]) {
              targetLane = lane
              break
            }
          }

          resultNotes.push({ time: note.time, lane: targetLane, end })
          flag[targetLane] = true
        }
      }
    }

    return {
      keys,
      notes: resultNotes,
      timing: diff.timing
    }
  }

  /**
   * 是否 LN。与 .osu 文本路径保持一致：len 存在但为 0 的 hold 在文本里会写成
   * `end == time` 的 hold 行，解析后 noteEnd === noteStart；此处按同一语义判定。
   */
  export function isLN(note: Note): boolean {
    return note.end !== undefined && note.end > note.time
  }

  /**
   * lane → `.osu` 的 x 坐标（该列中心）。
   * 供键型分析路径使用：`PatternOsuParser.convertHitObjects` 内部会用
   * `Rework_Parser.xToColumn(x, keys)` 把 x 还原成列，取列中心可保证往返无损。
   */
  export function laneToX(lane: number, keys: number): number {
    return (lane + 0.5) * (512 / keys)
  }
}
