import AdmZip from 'adm-zip'
import { basename, extname, posix } from 'node:path'

import { ChartTypeV2 } from '../preload/chart-types'
import fs from 'fs'

type diff = ChartTypeV2.diff

const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a', '.flac']
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']

// Internal interfaces for parsing malody .mc files.
// A beat is [measure, numerator, denominator] and its value is
// measure + numerator / denominator (a beat, not a bar).
interface McTimePoint {
  beat?: number[]
  bpm?: number
  // numerator of the time signature
  sign?: number
}

interface McNote {
  beat?: number[]
  column?: number
  endbeat?: number[]
  // 0 / undefined = playable note, 1 = sound cue, others are unused
  type?: number
  sound?: string
  vol?: number
  // ms offset of the sound cue
  offset?: number
}

interface McMeta {
  // 0 = Key, 3 = Catch, 4 = Pad, 5 = Taiko, 6 = Ring, 7 = Slide
  mode?: number
  mode_ext?: { column?: number }
  creator?: string
  version?: string
  background?: string
  preview?: number
  song?: {
    title?: string
    titleorg?: string
    artist?: string
    artistorg?: string
    id?: number | string
  }
}

interface McChart {
  meta?: McMeta
  time?: McTimePoint[]
  note?: McNote[]
  effect?: unknown[]
}

interface TimingSegment {
  beat: number
  bpm: number
  time: number
  num: number
}

/**
 * Beat value of a malody beat array. `[4, 2, 4]` means
 * "4 measures and 2 quarter notes", so `4 + 2 / 4`.
 */
function beat_value(beat: number[] | undefined): number {
  if (!Array.isArray(beat) || beat.length == 0) return 0
  const measure = Number(beat[0]) || 0
  const numerator = Number(beat[1]) || 0
  const denominator = Number(beat[2]) || 1
  return measure + numerator / denominator
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

/**
 * Build the beat -> ms conversion table. `start_time` is the real time of
 * beat 0, which is `-cue offset` because malody stores the music as a sound
 * cue that plays the audio after a delay.
 */
function build_segments(mc: McChart, start_time: number): TimingSegment[] {
  const points = (mc.time ?? [])
    .filter((t) => typeof t?.bpm == 'number' && (t.bpm as number) > 0)
    .map((t) => ({
      beat: beat_value(t.beat),
      bpm: t.bpm as number,
      num: typeof t.sign == 'number' && t.sign > 0 ? (t.sign as number) : 4
    }))
    .sort((a, b) => a.beat - b.beat)

  const merged: { beat: number; bpm: number; num: number }[] = []
  for (const p of points) {
    // a newer timing point on the same beat wins
    if (merged.length != 0 && Math.abs(merged[merged.length - 1].beat - p.beat) < 1e-6) {
      merged[merged.length - 1] = p
    } else {
      merged.push({ ...p })
    }
  }
  if (merged.length == 0) merged.push({ beat: 0, bpm: 120, num: 4 })
  // the first timing point should sit on beat 0, extend it backwards
  // otherwise so that beat 0 always has a well defined time
  if (merged[0].beat > 1e-6) {
    merged.unshift({ beat: 0, bpm: merged[0].bpm, num: merged[0].num })
  }

  const segments: TimingSegment[] = []
  for (let i = 0; i < merged.length; i++) {
    const p = merged[i]
    const time =
      i == 0
        ? start_time
        : segments[i - 1].time + (p.beat - segments[i - 1].beat) * (60000 / segments[i - 1].bpm)
    segments.push({ beat: p.beat, bpm: p.bpm, num: p.num, time })
  }
  return segments
}

function time_of_beat(segments: TimingSegment[], beat: number): number {
  let seg = segments[0]
  for (const s of segments) {
    if (s.beat <= beat + 1e-6) seg = s
    else break
  }
  return seg.time + (beat - seg.beat) * (60000 / seg.bpm)
}

/**
 * Convert a malody .mc chart into our diff format. `column` maps directly
 * to `lane` and the key count is carried in `override.max_lane`.
 */
function convert_to_diff(mc: McChart, keys: number, warnings: string[]): diff {
  const cue = (mc.note ?? []).find((n) => !!n?.type && typeof n?.offset == 'number')
  const cue_offset = cue ? Number(cue.offset) || 0 : 0

  const convert = (start_time: number) => {
    const segments = build_segments(mc, start_time)
    const notes: ChartTypeV2.note[] = []
    let min_time = Infinity

    for (const raw of mc.note ?? []) {
      if (!raw || typeof raw.column != 'number') continue
      if (raw.type) continue
      const lane = clamp(Math.round(raw.column), 0, keys - 1)
      const start = Math.round(time_of_beat(segments, beat_value(raw.beat)))
      min_time = Math.min(min_time, start)
      if (raw.endbeat) {
        const end = Math.round(time_of_beat(segments, beat_value(raw.endbeat)))
        if (end > start) {
          notes.push({ time: start, lane, width: 1, len: end - start })
          continue
        }
      }
      notes.push({ time: start, lane, width: 1, snm: 0 })
    }

    const timing: ChartTypeV2.timing[] = segments.map((s) => ({
      time: Math.round(s.time),
      bpm: s.bpm,
      num: s.num,
      den: 4
    }))
    if (timing.length != 0) min_time = Math.min(min_time, timing[0].time)

    notes.sort((a, b) => a.time - b.time)
    return { notes, timing, min_time }
  }

  let result = convert(-cue_offset)
  // a positive cue offset can push the beginning of the chart before the
  // audio starts, which we cannot represent. Ignoring the offset keeps
  // every note instead of dropping the ones that land before 0.
  if (Number.isFinite(result.min_time) && result.min_time < 0) {
    if (cue_offset != 0) {
      warnings.push('谱面开头的音频偏移会让音符落到 0ms 之前，已忽略该偏移。')
    }
    result = convert(0)
  }

  return {
    notes: result.notes,
    timing: result.timing,
    meta: {
      charter: mc.meta?.creator ?? '',
      diff1: mc.meta?.version ?? '',
      diff2: keys.toString(),
      diff_name: mc.meta?.version ?? '',
      rating: 0
    },
    override: {
      max_lane: keys
    }
  }
}

export interface song {
  name: string
  name_roman: string
  composer: string
  composer_roman: string
  bpm: string
  source: string
  sprite: string
  ref: string
}

/**
 * MCZ (malody) reader. A .mcz is a plain zip holding one or more `.mc`
 * (json) charts together with the audio and the background image.
 */
export class MczReader {
  static current: MczReader | undefined = undefined
  private diffs: diff[] = []
  private songInfo: song | null = null
  private zipEntries: AdmZip.IZipEntry[] = []
  private zip: AdmZip
  private images: [Buffer, string][] = []
  private warnings: string[] = []
  private audio_entry: AdmZip.IZipEntry | undefined = undefined
  private background_entry: AdmZip.IZipEntry | undefined = undefined

  constructor(fp_of_mcz: string) {
    this.zip = new AdmZip(fs.readFileSync(fp_of_mcz))
    this.zipEntries = this.zip.getEntries()
    this.parse_charts()
  }

  static create(fp_of_mcz: string) {
    const the = new MczReader(fp_of_mcz)
    MczReader.current = the
    return the
  }

  static close() {
    MczReader.current = undefined
  }

  public get_diffs(): diff[] {
    return this.diffs
  }

  public get_song(): song | null {
    return this.songInfo
  }

  /**
   * Things that were skipped or adjusted while reading, for the user.
   */
  public get_warnings(): string[] {
    return this.warnings
  }

  public getBackgroundImage(): Buffer | null {
    if (!this.background_entry) return null
    return this.background_entry.getData()
  }

  public getAudioFile(): [string, Buffer] | null {
    if (!this.audio_entry) return null
    return [extname(this.audio_entry.entryName), this.audio_entry.getData()]
  }

  public getImages(): [Buffer, string][] {
    if (this.images.length == 0) {
      for (const entry of this.zipEntries) {
        if (entry.isDirectory) continue
        if (IMAGE_EXTENSIONS.some((ext) => entry.entryName.toLowerCase().endsWith(ext))) {
          this.images.push([entry.getData(), basename(entry.entryName)])
        }
      }
    }
    // the background goes first, it becomes the cover on import
    if (this.background_entry) {
      const name = basename(this.background_entry.entryName)
      const index = this.images.findIndex(([, image_name]) => image_name == name)
      if (index > 0) this.images.unshift(this.images.splice(index, 1)[0])
    }
    return this.images
  }

  /**
   * Locate a file referenced by a chart. Malody charts usually reference
   * files relative to the .mc file itself, but the .mc can also live in a
   * sub folder (e.g. `chart/`), so fall back to the archive root and
   * finally to a case insensitive search on the file name.
   */
  private resolve_entry(reference: string | undefined, dir: string): AdmZip.IZipEntry | undefined {
    if (!reference) return undefined
    const clean = reference.replace(/\\/g, '/').replace(/^\.\//, '')
    const candidates = [posix.normalize(posix.join(dir, clean)), posix.normalize(clean)]
    for (const candidate of candidates) {
      const target = candidate.toLowerCase()
      const hit = this.zipEntries.find(
        (e) => !e.isDirectory && e.entryName.replace(/\\/g, '/').toLowerCase() == target
      )
      if (hit) return hit
    }
    const filename = basename(clean).toLowerCase()
    if (!filename) return undefined
    return this.zipEntries.find(
      (e) => !e.isDirectory && basename(e.entryName).toLowerCase() == filename
    )
  }

  private find_audio(): AdmZip.IZipEntry | undefined {
    const audio = this.zipEntries.filter(
      (e) =>
        !e.isDirectory && AUDIO_EXTENSIONS.some((ext) => e.entryName.toLowerCase().endsWith(ext))
    )
    if (audio.length == 0) return undefined
    // malody stores the audio as `music.mp3` most of the time
    return audio.find((e) => basename(e.entryName).toLowerCase().startsWith('music')) ?? audio[0]
  }

  private find_cover(): AdmZip.IZipEntry | undefined {
    const images = this.getImages()
    if (images.length == 0) return undefined
    const cover_like = ['cover', 'bg', 'background', 'jacket', 'illustration']
    const picked =
      images.find(([, name]) => cover_like.some((key) => name.toLowerCase().includes(key))) ??
      images[0]
    return this.zipEntries.find((e) => !e.isDirectory && basename(e.entryName) == picked[1])
  }

  private parse_charts() {
    const chart_entries = this.zipEntries.filter(
      (e) => !e.isDirectory && e.entryName.toLowerCase().endsWith('.mc')
    )
    if (chart_entries.length == 0) {
      this.warnings.push('没有在压缩包里找到谱面文件（.mc）。')
      return
    }

    let first: McChart | null = null
    let first_dir = ''

    for (const entry of chart_entries) {
      const name = basename(entry.entryName)
      let mc: McChart
      try {
        mc = JSON.parse(entry.getData().toString('utf8')) as McChart
      } catch {
        this.warnings.push(`谱面 ${name} 解析失败，已跳过。`)
        continue
      }
      if (!mc || typeof mc != 'object') {
        this.warnings.push(`谱面 ${name} 是空的，已跳过。`)
        continue
      }

      const mode = mc.meta?.mode ?? 0
      if (mode != 0) {
        this.warnings.push(`谱面 ${name} 不是 Key 模式（mode = ${mode}），已跳过。`)
        continue
      }

      const keys = clamp(Math.round(Number(mc.meta?.mode_ext?.column) || 4), 1, 32)
      const diff = convert_to_diff(mc, keys, this.warnings)
      if (diff.notes.length == 0) {
        this.warnings.push(`谱面 ${name} 里没有音符，已跳过。`)
        continue
      }
      if (!first) {
        first = mc
        first_dir = posix.dirname(entry.entryName.replace(/\\/g, '/'))
        if (first_dir == '.') first_dir = ''
      }
      this.diffs.push(diff)
    }

    if (!first) return

    // the assets referenced by the first chart decide how the song looks
    const cue = (first.note ?? []).find((n) => !!n?.type)
    this.audio_entry = this.resolve_entry(cue?.sound, first_dir) ?? this.find_audio()
    if (!this.audio_entry) this.warnings.push('没有找到音频文件，导入后需要手动指定。')

    this.background_entry =
      this.resolve_entry(first.meta?.background, first_dir) ?? this.find_cover()

    this.songInfo = this.extract_song(first)
  }

  private extract_song(mc: McChart): song {
    const meta = mc.meta ?? {}
    const song_data = meta.song ?? {}
    const first_bpm = (mc.time ?? []).find(
      (t) => typeof t?.bpm == 'number' && (t.bpm as number) > 0
    )

    return {
      name: song_data.titleorg || song_data.title || 'N/A',
      name_roman: song_data.title || 'N/A',
      composer: song_data.artistorg || song_data.artist || 'N/A',
      composer_roman: song_data.artist || 'N/A',
      bpm: first_bpm ? Math.round(Number(first_bpm.bpm)).toString() : '',
      source: 'N/A',
      sprite: this.background_entry ? basename(this.background_entry.entryName) : '',
      ref: song_data.id === undefined || song_data.id === null ? 'N/A' : String(song_data.id)
    }
  }
}
