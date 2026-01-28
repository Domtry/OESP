import sodium from 'react-native-libsodium'
import { b64urlEncode } from './b64url'

export type SyncOpts = { chunkSize?: number; windowSize?: number; retryMax?: number; timeoutMs?: number }

export async function uploadJournal(endpoint: string, sessionId: string, bytes: Uint8Array, opts: SyncOpts = {}): Promise<void> {
  const chunkSize = opts.chunkSize ?? 500 * 1024
  const windowSize = opts.windowSize ?? 4
  const retryMax = opts.retryMax ?? 3
  const timeoutMs = opts.timeoutMs ?? 2000
  await fetch(endpoint + '/sync/start', { method: 'POST', body: JSON.stringify({ session_id: sessionId }) })
  let seq = 0, offset = 0
  const inFlight = new Map<number, { payload: Uint8Array, retries: number, sentAt: number }>()
  while (offset < bytes.length || inFlight.size) {
    while (offset < bytes.length && inFlight.size < windowSize) {
      const end = Math.min(offset + chunkSize, bytes.length)
      const payload = bytes.slice(offset, end)
      const hash = sodium.crypto_hash_sha256(payload)
      await fetch(endpoint + '/sync/chunk', { method: 'POST', body: JSON.stringify({ session_id: sessionId, seq, bytes: b64urlEncode(payload), hash: b64urlEncode(hash) }) })
      inFlight.set(seq, { payload, retries: 0, sentAt: Date.now() })
      offset = end
      seq++
    }
    await new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))
    for (const [k, v] of inFlight) {
      if (Date.now() - v.sentAt >= timeoutMs) {
        if (v.retries >= retryMax) inFlight.delete(k)
        else { v.retries++; v.sentAt = Date.now() }
      }
    }
  }
  const finalHash = sodium.crypto_hash_sha256(bytes)
  await fetch(endpoint + '/sync/commit', { method: 'POST', body: JSON.stringify({ session_id: sessionId, final_hash: b64urlEncode(finalHash), total_chunks: seq }) })
}

