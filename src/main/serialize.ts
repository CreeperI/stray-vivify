/**
 * Chart Note Serialization Module for Main Process
 * 主进程专用的谱面音符序列化模块
 *
 * This module provides efficient binary encoding/decoding for chart notes,
 * used primarily for backup functionality in the main process.
 *
 * 此模块提供高效的音符二进制编解码，主要用于主进程中的备份功能。
 */

import { ChartTypeV2 } from '../preload/chart-types'
import zlib from 'node:zlib'

export namespace serialize {
  /**
   * Encode notes to a binary buffer (Uint8Array)
   * 将 note 序列编码为二进制缓冲区（Uint8Array）
   *
   * Format:
   * - Each note is encoded as: time(4 bytes) | lane(2 bytes) | width+type(1 byte) | [len(4 bytes)]
   * - Total: 7 bytes for normal notes, 11 bytes for hold notes
   */
  export function encodeToBuffer(notes: ChartTypeV2.note[]): Uint8Array {
    // Calculate required buffer size
    // 计算所需的缓冲区大小
    let bufferSize = 0
    for (const note of notes) {
      bufferSize += 7 // time(4) + lane(2) + width(1)
      if ('len' in note) {
        bufferSize += 4 // hold note length
      }
    }

    const buffer = new ArrayBuffer(bufferSize)
    const view = new DataView(buffer)
    let offset = 0

    for (const note of notes) {
      // Encode time (4 bytes, unsigned int32)
      // 编码时间（4字节，无符号32位整数）
      view.setUint32(offset, note.time, false)
      offset += 4

      // Encode lane (2 bytes, unsigned int16)
      // 编码轨道（2字节，无符号16位整数）
      view.setUint16(offset, note.lane, false)
      offset += 2

      // Encode width and type (1 byte each)
      // 编码宽度和类型（各1字节）
      // bit 7: isHold (1 if hold, 0 if normal)
      // bit 6-0: width
      const typeByte = ('len' in note ? 0x80 : 0) | (note.width & 0x7f)
      view.setUint8(offset, typeByte)
      offset += 1

      // For hold notes, encode length (4 bytes)
      // 对于长按音符，编码长度（4字节）
      if ('len' in note) {
        view.setUint32(offset, note.len, false)
        offset += 4
      }
    }

    return new Uint8Array(buffer)
  }

  /**
   * Decode a binary buffer back to notes
   * 将二进制缓冲区解码回 note 序列
   *
   * @param buffer - Uint8Array containing encoded notes
   */
  export function decodeFromBuffer(buffer: Uint8Array): ChartTypeV2.note[] {
    const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    const notes: ChartTypeV2.note[] = []
    let offset = 0

    while (offset < buffer.byteLength) {
      // Decode time (4 bytes)
      // 解码时间（4字节）
      const time = dataView.getUint32(offset, false)
      offset += 4

      // Decode lane (2 bytes)
      // 解码轨道（2字节）
      const lane = dataView.getUint16(offset, false)
      offset += 2

      // Decode type and width (1 byte)
      // 解码类型和宽度（1字节）
      const typeByte = dataView.getUint8(offset)
      offset += 1

      const isHold = (typeByte & 0x80) !== 0
      const width = typeByte & 0x7f

      if (isHold) {
        // Decode hold note
        // 解码长按音符
        const len = dataView.getUint32(offset, false)
        offset += 4

        notes.push({
          time,
          lane,
          width,
          len
        })
      } else {
        // Decode normal note
        // 解码普通音符
        notes.push({
          time,
          lane,
          width,
          snm: 0
        })
      }
    }

    return notes
  }

  /**
   * Compress diff data with efficient binary encoding and gzip compression
   * 使用高效的二进制编码和gzip压缩来压缩diff数据
   * @param diff - The diff object to compress
   * @returns Compressed buffer ready for storage
   */
  export function compressDiff(diff: ChartTypeV2.diff): Buffer {
    // Encode notes to binary buffer using serialize module
    // 使用serialize模块将notes编码为二进制缓冲区
    const notesBuffer = Buffer.from(encodeToBuffer(diff.notes))

    // Create a structured binary format:
    // [notes_length(4 bytes)][notes_data][timing_json_length(4 bytes)][timing_json][meta_json_length(4 bytes)][meta_json][override_flag(1 byte)][override_json(optional)]
    // 创建结构化的二进制格式
    const timingJson = Buffer.from(JSON.stringify(diff.timing))
    const metaJson = Buffer.from(JSON.stringify(diff.meta))
    const hasOverride = diff.override ? 1 : 0
    const overrideJson = diff.override ? Buffer.from(JSON.stringify(diff.override)) : Buffer.alloc(0)

    // Calculate total size
    // 计算总大小
    const totalSize = 4 + notesBuffer.length + 4 + timingJson.length + 4 + metaJson.length + 1 + (hasOverride ? 4 + overrideJson.length : 0)
    const result = Buffer.alloc(totalSize)
    let offset = 0

    // Write notes length and data
    // 写入notes长度和数据
    result.writeUInt32BE(notesBuffer.length, offset)
    offset += 4
    notesBuffer.copy(result, offset)
    offset += notesBuffer.length

    // Write timing JSON length and data
    // 写入timing JSON长度和数据
    result.writeUInt32BE(timingJson.length, offset)
    offset += 4
    timingJson.copy(result, offset)
    offset += timingJson.length

    // Write meta JSON length and data
    // 写入meta JSON长度和数据
    result.writeUInt32BE(metaJson.length, offset)
    offset += 4
    metaJson.copy(result, offset)
    offset += metaJson.length

    // Write override flag
    // 写入override标志
    result.writeUInt8(hasOverride, offset)
    offset += 1

    // Write override data if present
    // 如果存在则写入override数据
    if (hasOverride) {
      result.writeUInt32BE(overrideJson.length, offset)
      offset += 4
      overrideJson.copy(result, offset)
    }

    // Apply gzip compression for better compression ratio
    // 应用gzip压缩以获得更好的压缩率
    return zlib.gzipSync(result)
  }

  /**
   * Decompress diff data from compressed buffer
   * 从压缩的缓冲区解压diff数据
   * @param compressed - The compressed buffer
   * @returns Decompressed diff object
   */
  export function decompressDiff(compressed: Buffer): ChartTypeV2.diff {
    // First decompress gzip
    // 首先解压缩gzip
    const decompressed = zlib.gunzipSync(compressed)
    let offset = 0

    // Read notes length and data
    // 读取notes长度和数据
    const notesLength = decompressed.readUInt32BE(offset)
    offset += 4
    const notesBuffer = decompressed.slice(offset, offset + notesLength)
    offset += notesLength

    // Decode notes from binary buffer
    // 从二进制缓冲区解码notes
    const notes = decodeFromBuffer(new Uint8Array(notesBuffer))

    // Read timing JSON length and data
    // 读取timing JSON长度和数据
    const timingLength = decompressed.readUInt32BE(offset)
    offset += 4
    const timingJson = decompressed.slice(offset, offset + timingLength).toString('utf-8')
    offset += timingLength
    const timing = JSON.parse(timingJson) as ChartTypeV2.timing[]

    // Read meta JSON length and data
    // 读取meta JSON长度和数据
    const metaLength = decompressed.readUInt32BE(offset)
    offset += 4
    const metaJson = decompressed.slice(offset, offset + metaLength).toString('utf-8')
    offset += metaLength
    const meta = JSON.parse(metaJson) as ChartTypeV2.meta

    // Read override flag
    // 读取override标志
    const hasOverride = decompressed.readUInt8(offset)
    offset += 1

    // Read override data if present
    // 如果存在则读取override数据
    let override: ChartTypeV2.diff['override'] = undefined
    if (hasOverride) {
      const overrideLength = decompressed.readUInt32BE(offset)
      offset += 4
      const overrideJson = decompressed.slice(offset, offset + overrideLength).toString('utf-8')
      override = JSON.parse(overrideJson)
    }

    return {
      notes,
      timing,
      meta,
      override
    }
  }
}
