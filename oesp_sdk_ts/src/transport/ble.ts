import sodium from 'react-native-libsodium'
import { FrameType, TransportAdapter, SendOptions, Frame, HelloFrame, StartFrame, ChunkFrame, EndFrame, AckFrame, ReceiveState } from './types'

function encodeHello(version: number, mtu: number): Uint8Array {
  const b = new Uint8Array(1 + 1 + 2)
  b[0] = FrameType.HELLO
  b[1] = version & 0xff
  b[2] = (mtu >>> 8) & 0xff
  b[3] = mtu & 0xff
  return b
}

function encodeStart(totalLen: number, sha256: Uint8Array, mid: string): Uint8Array {
  const midBytes = new TextEncoder().encode(mid)
  const b = new Uint8Array(1 + 4 + 32 + 1 + midBytes.length)
  b[0] = FrameType.START
  b[1] = (totalLen >>> 24) & 0xff
  b[2] = (totalLen >>> 16) & 0xff
  b[3] = (totalLen >>> 8) & 0xff
  b[4] = totalLen & 0xff
  b.set(sha256, 5)
  b[37] = midBytes.length & 0xff
  b.set(midBytes, 38)
  return b
}

function encodeChunk(seq: number, payload: Uint8Array): Uint8Array {
  const b = new Uint8Array(1 + 4 + payload.length)
  b[0] = FrameType.CHUNK
  b[1] = (seq >>> 24) & 0xff
  b[2] = (seq >>> 16) & 0xff
  b[3] = (seq >>> 8) & 0xff
  b[4] = seq & 0xff
  b.set(payload, 5)
  return b
}

function encodeEnd(): Uint8Array {
  const b = new Uint8Array(1)
  b[0] = FrameType.END
  return b
}

function encodeAck(mid: string, ackSeq?: number): Uint8Array {
  const midBytes = new TextEncoder().encode(mid)
  const b = new Uint8Array(1 + 1 + midBytes.length + (ackSeq !== undefined ? 4 : 0))
  b[0] = FrameType.ACK
  b[1] = midBytes.length & 0xff
  b.set(midBytes, 2)
  if (ackSeq !== undefined) {
    const off = 2 + midBytes.length
    b[off] = (ackSeq >>> 24) & 0xff
    b[off + 1] = (ackSeq >>> 16) & 0xff
    b[off + 2] = (ackSeq >>> 8) & 0xff
    b[off + 3] = ackSeq & 0xff
  }
  return b
}

/** Fragment and send a token over BLE with optional window/ACK/retry. */
export async function sendToken(adapter: TransportAdapter, token: Uint8Array, mid: string, opts: SendOptions = {}): Promise<void> {
  const maxChunkSize = opts.maxChunkSize ?? 512
  const windowSize = opts.windowSize ?? 4
  const ackEnabled = opts.ackEnabled ?? true
  const retryMax = opts.retryMax ?? 3
  const timeoutMs = opts.timeoutMs ?? 2000

  adapter.setMaxChunkSize(maxChunkSize)
  await adapter.write(encodeHello(1, maxChunkSize))
  const hash = sodium.crypto_hash_sha256(token)
  await adapter.write(encodeStart(token.length, hash, mid))

  let seq = 0
  let offset = 0
  const inFlight = new Map<number, { payload: Uint8Array, sentAt: number, retries: number }>()

  while (offset < token.length || inFlight.size > 0) {
    while (offset < token.length && inFlight.size < windowSize) {
      const end = Math.min(offset + maxChunkSize, token.length)
      const payload = token.slice(offset, end)
      const frame = encodeChunk(seq, payload)
      await adapter.write(frame)
      inFlight.set(seq, { payload, sentAt: Date.now(), retries: 0 })
      offset = end
      seq += 1
    }

    if (ackEnabled) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          // timeout -> retries
          for (const [k, v] of inFlight) {
            if (Date.now() - v.sentAt >= timeoutMs) {
              if (v.retries >= retryMax) {
                inFlight.delete(k)
              } else {
                // resend
                adapter.write(encodeChunk(k, v.payload)).then(() => {
                  v.sentAt = Date.now(); v.retries += 1
                })
              }
            }
          }
          resolve()
        }, timeoutMs)
        adapter.onReceive((frame) => {
          if (frame[0] === FrameType.ACK) {
            // parse ackSeq if present
            const len = frame[1]
            const ackSeq = frame.length >= 2 + len + 4 ?
              ((frame[2 + len] << 24) | (frame[3 + len] << 16) | (frame[4 + len] << 8) | frame[5 + len]) >>> 0 : undefined
            if (ackSeq !== undefined) inFlight.delete(ackSeq)
            clearTimeout(timer)
            resolve()
          }
        })
      })
    } else {
      // No ACK mode: small delay to avoid congestion
      await new Promise(r => setTimeout(r, 10))
      inFlight.clear()
    }
  }

  await adapter.write(encodeEnd())
}

/** Reassemble token from incoming frames; validates sha256 and length, returns token bytes. */
export async function reassembleToken(adapter: TransportAdapter): Promise<Uint8Array> {
  let state: ReceiveState | null = null
  return await new Promise<Uint8Array>((resolve, reject) => {
    adapter.onReceive((frame) => {
      const t = frame[0]
      if (t === FrameType.HELLO) {
        // ignore
      } else if (t === FrameType.START) {
        const totalLen = (frame[1] << 24) | (frame[2] << 16) | (frame[3] << 8) | frame[4]
        const sha = frame.slice(5, 37)
        state = { totalLen, sha256: sha, received: new Map(), nextSeq: 0 }
      } else if (t === FrameType.CHUNK) {
        if (!state) return
        const seq = (frame[1] << 24) | (frame[2] << 16) | (frame[3] << 8) | frame[4]
        const payload = frame.slice(5)
        state.received.set(seq, payload)
        // optionally send ACK for seq
        adapter.write(encodeAck('mid', seq)).catch(() => {})
      } else if (t === FrameType.END) {
        if (!state) return reject(new Error('No START'))
        const out = new Uint8Array(state.totalLen)
        let off = 0
        for (let i = 0; i < state.received.size; i++) {
          const p = state.received.get(i)
          if (!p) return reject(new Error('Missing chunk ' + i))
          out.set(p, off); off += p.length
        }
        const hash = sodium.crypto_hash_sha256(out)
        if (hash.length !== state.sha256.length) return reject(new Error('SHA256 mismatch'))
        for (let i = 0; i < hash.length; i++) { if (hash[i] !== state.sha256[i]) return reject(new Error('SHA256 mismatch')) }
        resolve(out)
      }
    })
  })
}

export const Frames = { encodeHello, encodeStart, encodeChunk, encodeEnd, encodeAck }
