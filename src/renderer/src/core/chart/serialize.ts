/**
 * Terminal's Note
 * You see this's a total vibe-coding shit. Don't sue me for this.
 * Also i've told this ai to write all comments in cn+en style.
 * */

/**
 * Chart Note Serialization Module
 * 谱面音符序列化模块
 *
 * This module provides efficient binary encoding/decoding for chart notes,
 * used primarily for backup functionality to reduce storage space.
 *
 * 此模块提供高效的音符二进制编解码，主要用于备份功能以减少存储空间。
 *
 * ## Binary Format - 二进制格式
 *
 * Each note is encoded as:
 * 每个音符编码为：
 *
 * ```
 * [Time: 4 bytes][Lane: 2 bytes][Type+Width: 1 byte][Len?: 4 bytes]
 * ```
 *
 * Type byte structure:
 * 类型字节结构：
 * - Bit 7 (MSB): Is hold note (1 = hold, 0 = normal)
 * - Bits 0-6: Width value (0-127)
 *
 * - 第7位（最高位）：是否长按音符（1 = 长按，0 = 普通）
 * - 第0-6位：宽度值（0-127）
 *
 * ## Compression Ratio - 压缩率
 *
 * For typical charts:
 * 对于典型谱面：
 *
 * - Normal note: 7 bytes (vs ~50 bytes in JSON) - 普通音符：7字节（JSON 约 50 字节）
 * - Hold note: 11 bytes (vs ~70 bytes in JSON) - 长按音符：11字节（JSON 约 70 字节）
 * - **Compression ratio: ~85%** - **压缩率：约 85%**
 *
 * ## Usage Example - 使用示例
 *
 * ```typescript
 * import { serialize } from '@renderer/core/chart/serialize'
 * import { ChartTypeV2 } from '@preload/chart-types'
 *
 * // Encode notes - 编码音符
 * const notes: ChartTypeV2.note[] = [
 *   { time: 1000, lane: 0, width: 1, snm: 0 },
 *   { time: 2000, lane: 1, width: 2, len: 500 }
 * ]
 * const encoded = serialize.encode(notes)
 *
 * // Decode notes - 解码音符
 * const decoded = serialize.decode(encoded)
 * ```
 *
 * ## Backup Integration - 备份集成
 *
 * The serialization is used in Chart.backup() to create compressed_final:
 * 序列化用于 Chart.backup() 创建 compressed_final：
 *
 * ```typescript
 * const compressed: ChartTypeV2.compressed_final = {
 *   song: this.song.save(),
 *   vsm: this.vsm.data,
 *   version: Storage.version,
 *   diffs: this.diffs.map((diff) => ({
 *     notes: Array.from(serialize.encodeToBuffer(diff.notes)),  // Binary as number[]
 *     timing: diff.timing,
 *     meta: diff.meta,
 *     override: diff.override
 *   }))
 * }
 * await Invoke('store-backup', {
 *   id: this.id,
 *   data: JSON.stringify(compressed)
 * })
 * ```
 *
 * Backup files are stored as binary format (.svb): charts/{id}/backup/yymmdd-hhmmss.svb
 * 备份文件存储为二进制格式（.svb）：charts/{id}/backup/yymmdd-hhmmss.svb
 *
 * ## Performance Benefits - 性能优势
 *
 * Using binary buffers instead of base64 provides:
 * 使用二进制缓冲区而非 base64 提供：
 *
 * - **No encoding overhead**: Direct binary storage avoids 33% base64 expansion
 * - **无编码开销**：直接二进制存储避免了 33% 的 base64 膨胀
 * - **Faster processing**: No need for btoa/atob conversion
 * - **更快的处理**：无需 btoa/atob 转换
 * - **Smaller file size**: Pure binary data is more compact
 * - **更小的文件大小**：纯二进制数据更紧凑
 */

import { ChartTypeV2 } from '@preload/chart-types'

export namespace serialize {
  /**
   * Encode notes to a compressed binary string (base64)
   * 将 note 序列编码为压缩的二进制字符串（base64）
   *
   * Format:
   * - Each note is encoded as: time(4 bytes) | lane(2 bytes) | width(1 byte) | type(1 byte) | optional data
   * - For hold notes: len(4 bytes)
   * - Uses base64 encoding for safe string transport
   *
   * @deprecated Use encodeToBuffer() for better performance
   */
  export function encode(notes: ChartTypeV2.note[]): string {
    const buffer = encodeToBuffer(notes)
    // Convert to base64 string
    // 转换为 base64 字符串
    let binary = ''
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i])
    }
    return btoa(binary)
  }

  /**
   * Encode notes to a binary buffer (Uint8Array)
   * 将 note 序列编码为二进制缓冲区（Uint8Array）
   *
   * This is more efficient than base64 encoding as it avoids the 33% overhead.
   * 这比 base64 编码更高效，避免了 33% 的开销。
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
   * Decode a compressed string back to notes (base64)
   * 将压缩的字符串解码回 note 序列（base64）
   *
   * @deprecated Use decodeFromBuffer() for better performance
   */
  export function decode(encoded: string): ChartTypeV2.note[] {
    // Decode base64 to binary
    // 从 base64 解码为二进制
    const binary = atob(encoded)
    const buffer = new ArrayBuffer(binary.length)
    const view = new Uint8Array(buffer)

    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i)
    }

    return decodeFromBuffer(view)
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
}
