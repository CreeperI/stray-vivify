import AdmZip from 'adm-zip'
import { basename, extname } from 'node:path'

import { ChartTypeV2 } from '../preload/chart-types'
import fs from 'fs'

type diff = ChartTypeV2.diff

// Internal interfaces for parsing
interface OsuTimingPoint {
  time: number
  beatLength: number
  meter: number
  sampleSet: number
  sampleIndex: number
  volume: number
  uninherited: boolean
  effects: number
}

interface OsuHitObject {
  x: number
  y: number
  time: number
  type: number
  hitSound: number
  objectParams?: string
  hitSample?: string
}

interface OsuBeatmap {
  general: { [key: string]: string | number }
  metadata: { [key: string]: string }
  difficulty: { [key: string]: number }
  timingPoints: OsuTimingPoint[]
  hitObjects: OsuHitObject[]
  events: string[]
}

/**
 * Parse a .osu file content
 */
function parseOsuFile(content: string): OsuBeatmap {
  const lines = content.split('\n').map((line) => line.trim())

  const beatmap: OsuBeatmap = {
    general: {},
    metadata: {},
    difficulty: {},
    timingPoints: [],
    hitObjects: [],
    events: []
  }

  let currentSection = ''

  for (const line of lines) {
    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1)
      continue
    }

    if (line === '' || line.startsWith('//')) continue

    switch (currentSection) {
      case 'General':
        parseKeyValueLine(line, beatmap.general)
        break
      case 'Metadata':
        parseKeyValueLine(line, beatmap.metadata)
        break
      case 'Difficulty':
        parseKeyValueLine(line, beatmap.difficulty)
        break
      case 'TimingPoints':
        const timingPoint = parseTimingPoint(line)
        if (timingPoint) beatmap.timingPoints.push(timingPoint)
        break
      case 'HitObjects':
        const hitObject = parseHitObject(line)
        if (hitObject) beatmap.hitObjects.push(hitObject)
        break
      case 'Events':
        beatmap.events.push(line)
        break
    }
  }

  return beatmap
}

/**
 * Parse key:value lines
 */
function parseKeyValueLine(line: string, target: { [key: string]: any }): void {
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) return

  const key = line.substring(0, colonIndex).trim()
  let value: any = line.substring(colonIndex + 1).trim()

  // Try to convert to number if possible
  const numValue = Number(value)
  if (!isNaN(numValue) && value !== '') {
    value = numValue
  }

  target[key] = value
}

/**
 * Parse timing point line
 */
function parseTimingPoint(line: string): OsuTimingPoint | null {
  const parts = line.split(',')
  if (parts.length < 2) return null

  return {
    time: parseInt(parts[0]) || 0,
    beatLength: parseFloat(parts[1]) || 0,
    meter: parseInt(parts[2]) || 4,
    sampleSet: parseInt(parts[3]) || 0,
    sampleIndex: parseInt(parts[4]) || 0,
    volume: parseInt(parts[5]) || 100,
    uninherited: (parseInt(parts[6]) || 1) === 1,
    effects: parseInt(parts[7]) || 0
  }
}

/**
 * Parse hit object line
 */
function parseHitObject(line: string): OsuHitObject | null {
  const parts = line.split(',')
  if (parts.length < 5) return null

  const hitObject: OsuHitObject = {
    x: parseInt(parts[0]) || 0,
    y: parseInt(parts[1]) || 0,
    time: parseInt(parts[2]) || 0,
    type: parseInt(parts[3]) || 0,
    hitSound: parseInt(parts[4]) || 0
  }

  if (parts.length > 5) hitObject.objectParams = parts[5]
  if (parts.length > 6) hitObject.hitSample = parts[6]

  return hitObject
}

/**
 * Convert osu! beatmap to diff format
 */
function convertToDiff(beatmap: OsuBeatmap, isMania: boolean): ChartTypeV2.diff {
  const notes: ChartTypeV2.note[] = []
  const timing: ChartTypeV2.timing[] = []

  // Get key count from CircleSize
  const keyCount = isMania ? Math.floor(beatmap.difficulty.CircleSize || 4) : 1

  // Process timing points
  for (const tp of beatmap.timingPoints) {
    if (tp.uninherited) {
      // Uninherited timing point - actual BPM change
      // Skip if beatLength is negative or zero (malformed data)
      if (tp.beatLength <= 0) continue

      const bpm = 60000 / tp.beatLength // Convert beat length to BPM
      timing.push({
        time: tp.time,
        bpm: bpm,
        den: 4,
        num: tp.meter // Use the meter from the timing point
      })
    }
  }

  // Process hit objects
  if (isMania) {
    // Process mania hit objects normally
    for (const hitObject of beatmap.hitObjects) {
      const lane = calculateLane(hitObject.x, keyCount)
      const time = hitObject.time

      // Check if it's a hold note (bit 7 set)
      if (hitObject.type & (1 << 7)) {
        // Hold note
        const endTime = parseEndTime(hitObject.objectParams || '')
        const holdNote: ChartTypeV2.hold_note = {
          time: time,
          lane: lane,
          width: 1,
          len: endTime - time
        }
        notes.push(holdNote)
      } else {
        // Normal note
        const normalNote: ChartTypeV2.normal_note = {
          time: time,
          lane: lane,
          width: 1,
          snm: 0
        }
        notes.push(normalNote)
      }
    }
  } else {
    // Convert other modes to 1K mania
    for (const hitObject of beatmap.hitObjects) {
      const time = hitObject.time

      // Check object type
      const isCircle = hitObject.type & (1 << 0)
      const isSlider = hitObject.type & (1 << 1)
      const isSpinner = hitObject.type & (1 << 3)

      if (isCircle) {
        // Convert hit circles to normal notes in lane 0
        const normalNote: ChartTypeV2.normal_note = {
          time: time,
          lane: 0,
          width: 1,
          snm: 0
        }
        notes.push(normalNote)
      } else if (isSlider) {
        // Convert sliders to hold notes in lane 0
        // Parse slider duration from objectParams
        const sliderDuration = parseSliderDuration(hitObject.objectParams || '', beatmap)
        const holdNote: ChartTypeV2.hold_note = {
          time: time,
          lane: 0,
          width: 1,
          len: sliderDuration
        }
        notes.push(holdNote)
      } else if (isSpinner) {
        // Convert spinners to hold notes in lane 0
        const endTime = parseEndTime(hitObject.objectParams || '')
        const holdNote: ChartTypeV2.hold_note = {
          time: time,
          lane: 0,
          width: 1,
          len: endTime - time
        }
        notes.push(holdNote)
      }
    }
  }

  // Sort notes by time
  notes.sort((a, b) => a.time - b.time)

  // Sort timing by time
  timing.sort((a, b) => a.time - b.time)

  const result: ChartTypeV2.diff = {
    notes,
    timing,
    meta: {
      charter: (beatmap.metadata.Creator as string) || '',
      diff1: (beatmap.metadata.Version as string) || '',
      diff2: keyCount.toString(), // Store key count in diff2
      diff_name: (beatmap.metadata.Version as string) || '',
      rating: 0
    }
  }

  // Add override flag for non-mania modes
  if (!isMania) {
    result.override = {
      max_lane: 1
    }
  }

  return result
}

/**
 * Calculate lane from x position
 * osu!mania uses x position to determine column
 */
function calculateLane(x: number, keyCount: number): number {
  // Formula from osu! wiki: floor(x * columnCount / 512)
  const lane = Math.floor((x * keyCount) / 512)
  return Math.max(0, Math.min(lane, keyCount - 1))
}

/**
 * Parse end time from hold note objectParams
 */
function parseEndTime(objectParams: string): number {
  // For hold notes, objectParams contains "endTime:hitSample"
  const parts = objectParams.split(':')
  return parseInt(parts[0]) || 0
}

/**
 * Parse slider duration from objectParams for non-mania modes
 */
function parseSliderDuration(objectParams: string, beatmap: OsuBeatmap): number {
  // Slider format: curveType|curvePoints,slides,length,edgeSounds,edgeSets,hitSample
  const parts = objectParams.split(',')

  if (parts.length < 3) return 100 // Default duration if parsing fails

  const slides = parseInt(parts[1]) || 1
  const length = parseFloat(parts[2]) || 100

  // Get slider multiplier from difficulty settings
  const sliderMultiplier = beatmap.difficulty.SliderMultiplier || 1.4

  // Find the current timing point for this slider
  // For simplicity, use the first uninherited timing point
  const firstTiming = beatmap.timingPoints.find((tp) => tp.uninherited)
  const beatLength = firstTiming?.beatLength || 500

  // Calculate slider duration in milliseconds
  // Formula: length / (SliderMultiplier * 100 * SV) * beatLength
  // Assuming SV = 1 for simplicity
  const duration = (length / (sliderMultiplier * 100)) * beatLength * slides

  return Math.round(duration)
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
 * OSZ Reader class with methods to get difficulties and song info
 */
export class OszReader {
  static current: OszReader | undefined = undefined
  private diffs: diff[] = []
  private songInfo: song | null = null
  private zipEntries: AdmZip.IZipEntry[] = []
  private zip: AdmZip
  private images: [Buffer, string][] = []

  constructor(fp_of_osz: string) {
    this.zip = new AdmZip(fs.readFileSync(fp_of_osz))
    this.zipEntries = this.zip.getEntries()
    this.parseBeatmaps()
  }

  static create(fp_of_osz: string) {
    const the = new OszReader(fp_of_osz)
    OszReader.current = the
    return the
  }

  static close() {
    OszReader.current = undefined
  }

  /**
   * Get all difficulties
   */
  public get_diffs(): diff[] {
    return this.diffs
  }

  /**
   * Get song information
   */
  public get_song(): song | null {
    return this.songInfo
  }

  /**
   * Get background image as buffer
   */
  public getBackgroundImage(): Buffer | null {
    if (!this.songInfo?.sprite) return null

    const entry = this.zipEntries.find(
      (e) => e.entryName === this.songInfo!.sprite && !e.isDirectory
    )

    return entry ? entry.getData() : null
  }

  /**
   * Get audio file as buffer
   */
  public getAudioFile(): [string, Buffer] | null {
    // Look for common audio file extensions
    const audioExtensions = ['.mp3', '.ogg', '.wav']

    const audioEntry = this.zipEntries.find(
      (entry) =>
        audioExtensions.some((ext) => {
          return entry.entryName.toLowerCase().endsWith(ext)
        }) && !entry.isDirectory
    )

    return audioEntry ? [extname(audioEntry.name), audioEntry.getData()] : null
  }

  /**
   * Get all image files as a map
   */
  public getImages() {
    const images: [Buffer, string][] = this.images
    if (images.length > 0) return this.images
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']

    this.zipEntries.forEach((entry) => {
      if (
        imageExtensions.some((ext) => entry.entryName.toLowerCase().endsWith(ext)) &&
        !entry.isDirectory
      ) {
        images.push([entry.getData(), basename(entry.entryName)])
      }
    })

    return images
  }

  /**
   * Parse all beatmaps and extract song info
   */
  private parseBeatmaps(): void {
    let firstBeatmap: OsuBeatmap | null = null

    this.zipEntries.forEach((entry) => {
      if (entry.entryName.endsWith('.osu') && !entry.isDirectory) {
        const content = entry.getData().toString('utf8')
        const beatmap = parseOsuFile(content)

        // Store first beatmap for song info extraction
        if (!firstBeatmap) {
          firstBeatmap = beatmap
        }

        // Process all modes
        // Mode 0 = osu!standard, 1 = taiko, 2 = catch, 3 = mania
        const isMania = beatmap.general.Mode === 3
        const difficulty = convertToDiff(beatmap, isMania)
        this.diffs.push(difficulty)
      }
    })

    // Extract song info from first beatmap
    if (firstBeatmap) {
      this.songInfo = this.extractSongInfo(firstBeatmap)
    }
  }

  /**
   * Extract song information from beatmap metadata
   */
  private extractSongInfo(beatmap: OsuBeatmap): song {
    // Find background image
    let backgroundSprite = ''
    for (const event of beatmap.events) {
      if (event.startsWith('0,0,')) {
        const parts = event.split(',')
        if (parts.length >= 3) {
          backgroundSprite = parts[2].replace(/"/g, '')
          break
        }
      }
    }

    // Calculate average BPM from timing points
    let avgBpm = ''
    const uninheritedTimingPoints = beatmap.timingPoints.filter(
      (tp) => tp.uninherited && tp.beatLength > 0
    )
    if (uninheritedTimingPoints.length > 0) {
      const bpms = uninheritedTimingPoints.map((tp) => 60000 / tp.beatLength)
      const averageBpm = bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length
      avgBpm = Math.round(averageBpm).toString()
    }

    return {
      name:
        (beatmap.metadata.TitleUnicode as string) || (beatmap.metadata.Title as string) || 'N/A',
      name_roman: (beatmap.metadata.Title as string) || 'N/A',
      composer:
        (beatmap.metadata.ArtistUnicode as string) || (beatmap.metadata.Artist as string) || 'N/A',
      composer_roman: (beatmap.metadata.Artist as string) || 'N/A',
      bpm: avgBpm,
      source: (beatmap.metadata.Source as string) || 'N/A',
      sprite: backgroundSprite,
      ref: (beatmap.metadata.BeatmapSetID as string) || 'N/A'
    }
  }
}
