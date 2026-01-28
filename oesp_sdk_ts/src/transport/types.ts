/** BLE Transport frame types for OESP token transfer (no pairing). */
export enum FrameType {
  HELLO = 0x01,
  START = 0x02,
  CHUNK = 0x03,
  END = 0x04,
  ACK = 0x05,
}

export type HelloFrame = {
  type: FrameType.HELLO
  version: number
  mtu: number
}

export type StartFrame = {
  type: FrameType.START
  totalLen: number
  sha256: Uint8Array
  mid: string
}

export type ChunkFrame = {
  type: FrameType.CHUNK
  seq: number
  bytes: Uint8Array
}

export type EndFrame = {
  type: FrameType.END
}

export type AckFrame = {
  type: FrameType.ACK
  mid: string
  ackSeq?: number
}

export type Frame = HelloFrame | StartFrame | ChunkFrame | EndFrame | AckFrame

/**
 * Minimal transport adapter abstraction for BLE GATT.
 * Implementations are responsible for mapping write/read to GATT characteristics.
 */
export interface TransportAdapter {
  write(frame: Uint8Array): Promise<void>
  onReceive(cb: (frame: Uint8Array) => void): void
  setMaxChunkSize(size: number): void
}

export type SendOptions = {
  maxChunkSize?: number
  windowSize?: number
  ackEnabled?: boolean
  retryMax?: number
  timeoutMs?: number
}

export type ReceiveState = {
  totalLen: number
  sha256: Uint8Array
  received: Map<number, Uint8Array>
  nextSeq: number
}

