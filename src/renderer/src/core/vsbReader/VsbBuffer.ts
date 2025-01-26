import { Buffer } from 'buffer'

class MessageBuffer {
  private buffer: Uint8Array
  private position: number

  constructor(init: Uint8Array) {
    this.buffer = init
    this.position = 0
  }

  get size(): number {
    return this.buffer.length
  }

  setBuffer(buffer: Uint8Array): void {
    this.buffer = buffer
  }

  readByte(): number {
    const val = this.buffer[this.position]
    this.position += 1
    return val
  }

  readSByte(): number {
    const val = this.buffer[this.position]
    this.position += 1
    return val
  }

  readUInt16(): number {
    const val = this.buffer[this.position] | (this.buffer[this.position + 1] << 8)
    this.position += 2
    return val
  }

  readInt16(): number {
    const val = this.buffer[this.position] | (this.buffer[this.position + 1] << 8)
    this.position += 2
    return val
  }

  readUInt32(): number {
    const val =
      this.buffer[this.position] |
      (this.buffer[this.position + 1] << 8) |
      (this.buffer[this.position + 2] << 16) |
      (this.buffer[this.position + 3] << 24)
    this.position += 4
    return val
  }

  readInt32(): number {
    const val =
      this.buffer[this.position] |
      (this.buffer[this.position + 1] << 8) |
      (this.buffer[this.position + 2] << 16) |
      (this.buffer[this.position + 3] << 24)
    this.position += 4
    return val
  }

  readInt64(): bigint {
    const val =
      BigInt(this.buffer[this.position]) |
      (BigInt(this.buffer[this.position + 1]) << BigInt(8)) |
      (BigInt(this.buffer[this.position + 2]) << BigInt(16)) |
      (BigInt(this.buffer[this.position + 3]) << BigInt(24)) |
      (BigInt(this.buffer[this.position + 4]) << BigInt(32)) |
      (BigInt(this.buffer[this.position + 5]) << BigInt(40)) |
      (BigInt(this.buffer[this.position + 6]) << BigInt(48)) |
      (BigInt(this.buffer[this.position + 7]) << BigInt(56))
    this.position += 8
    return val
  }

  readHalf(): number {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.position, 2)
    const value = view.getUint16(0, true)
    this.position += 2
    // Convert half-precision float to single-precision float
    const s = (value & 0x8000) >> 15
    const e = (value & 0x7c00) >> 10
    const f = value & 0x03ff
    if (e === 0) {
      return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10))
    } else if (e === 0x1f) {
      return f !== 0 ? NaN : s ? -Infinity : Infinity
    } else {
      return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / Math.pow(2, 10))
    }
  }

  readFloat(): number {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.position, 4)
    const val = view.getFloat32(0, true)
    this.position += 4
    return val
  }

  readDouble(): number {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.position, 8)
    const val = view.getFloat64(0, true)
    this.position += 8
    return val
  }

  readBoolean(): boolean {
    const val = this.buffer[this.position]
    this.position += 1
    return val === 1
  }

  readString(): string {
    const stringEnd = this.buffer.indexOf(0, this.position) + 1
    const value = Buffer.from(this.buffer.slice(this.position, stringEnd)).toString('utf-8')
    this.position += value.length
    return value
  }

  readByNoteType(t: number): number {
    if (t === 6) {
      return this.readInt32()
    } else if (t === 8) {
      return this.readFloat()
    }
    throw new Error('Unknown type')
  }

  writeByte(val: number): void {
    this.buffer[this.position] = val
    this.position += 1
  }

  writeSByte(val: number): void {
    this.buffer[this.position] = val + 128
    this.position += 1
  }

  writeUInt16(val: number): void {
    this.buffer[this.position] = val & 0xff
    this.buffer[this.position + 1] = (val >> 8) & 0xff
    this.position += 2
  }

  writeInt16(val: number): void {
    this.buffer[this.position] = val & 0xff
    this.buffer[this.position + 1] = (val >> 8) & 0xff
    this.position += 2
  }

  writeUInt32(val: number): void {
    this.buffer[this.position] = val & 0xff
    this.buffer[this.position + 1] = (val >> 8) & 0xff
    this.buffer[this.position + 2] = (val >> 16) & 0xff
    this.buffer[this.position + 3] = (val >> 24) & 0xff
    this.position += 4
  }

  writeInt32(val: number): void {
    this.buffer[this.position] = val & 0xff
    this.buffer[this.position + 1] = (val >> 8) & 0xff
    this.buffer[this.position + 2] = (val >> 16) & 0xff
    this.buffer[this.position + 3] = (val >> 24) & 0xff
    this.position += 4
  }

  writeFloat(val: number): void {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.position, 4)
    view.setFloat32(0, val, true)
    this.position += 4
  }

  writeDouble(val: number): void {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.position, 8)
    view.setFloat64(0, val, true)
    this.position += 8
  }

  writeBoolean(val: boolean): void {
    this.buffer[this.position] = val ? 1 : 0
    this.position += 1
  }

  writeString(val: string): void {
    const encoded = Buffer.from(val, 'utf-8')
    this.writeUInt16(encoded.length)
    for (let i = 0; i < encoded.length; i++) {
      this.buffer[this.position + i] = encoded[i]
    }
    this.position += encoded.length
  }

  readByType(t: number): number | bigint | string | boolean {
    if (t === 0) {
      return this.readByte()
    } else if (t === 1) {
      return this.readSByte()
    } else if (t === 2) {
      return this.readUInt16()
    } else if (t === 3) {
      return this.readInt16()
    } else if (t === 4) {
      return this.readUInt32()
    } else if (t === 5) {
      return this.readInt32()
    } else if (t === 6) {
      return this.readInt32()
    } else if (t === 7) {
      return this.readHalf()
    } else if (t === 8) {
      return this.readFloat()
    } else if (t === 9) {
      return this.readDouble()
    } else if (t === 10) {
      return this.readBoolean()
    } else if (t === 11) {
      return this.readString()
    }
    throw new Error('Unknown Type.')
  }
}

export default MessageBuffer
