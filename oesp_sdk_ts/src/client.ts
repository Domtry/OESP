import { EnvelopeV1, DecodedMessage, VerifiedEnvelope } from "./types"
import { canonicalJsonBytes } from "./canonical"
import { b64urlEncode, b64urlDecode } from "./b64url"
import { deriveDid } from "./did"
import { aeadEncrypt, aeadDecrypt, sealSessionKeyX25519, openSealedSessionKeyX25519, signEd25519, verifyEd25519 } from "./crypto"
import type { Keystore } from "./adapters/keystore"
import type { Storage } from "./adapters/storage"
import type { Resolver } from "./adapters/resolver"
import { InvalidSignatureError, ExpiredError, ReplayError, InvalidFormatError, DecryptionFailedError, ResolveFailedError, InvalidDIDError } from "./errors"
import sodium from 'react-native-libsodium'

export class OESPClient {
  constructor(private keystore: Keystore, private storage: Storage, private resolver: Resolver) {}

  dataToSign(envelope: EnvelopeV1, ctBytes: Uint8Array): Uint8Array {
    const base = canonicalJsonBytes(envelope as unknown as Record<string, unknown>, ["sig"]) 
    return concatBytes(base, ctBytes)
  }

  async getDid(): Promise<string> {
    const edPub = await this.keystore.getPublicKey()
    return deriveDid(edPub)
  }

  private normalizeBody(body: Uint8Array | Record<string, unknown>): Uint8Array {
    if (body instanceof Uint8Array) return body
    const s = stableStringify(body)
    return new TextEncoder().encode(s)
  }

  async pack(toDid: string, body: Uint8Array | Record<string, unknown>, ttlSec = 600): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const exp = now + ttlSec
    const mid = randomBase64Url(12)
    const sid = await this.getDid()
    const edPub = await this.keystore.getPublicKey()
    const fromDid = sid
    const fromPubB64 = b64urlEncode(edPub)
    let toXPub: Uint8Array
    try {
      toXPub = await this.resolver.resolveDid(toDid)
    } catch (e: any) {
      throw new ResolveFailedError(String(e?.message || e))
    }
    const sessionKey = randomBytes(32)
    const ekBytes = sealSessionKeyX25519(toXPub, sessionKey)
    const env: EnvelopeV1 = {
      v: 1,
      typ: "msg",
      mid,
      sid,
      ts: now,
      exp,
      from: { did: fromDid, pub: fromPubB64 },
      to: { did: toDid },
      enc: "CHACHA20-POLY1305",
      kex: "X25519",
      ek: b64urlEncode(ekBytes),
      iv: "",
      ct: "",
      sig_alg: "Ed25519",
      sig: ""
    }
    const aad = canonicalJsonBytes(env as unknown as Record<string, unknown>, ["ct", "sig", "iv"])
    const { iv, ct } = aeadEncrypt(sessionKey, this.normalizeBody(body), aad)
    env.iv = b64urlEncode(iv)
    env.ct = b64urlEncode(ct)
    const sig = signEd25519(this.dataToSign(env, ct), await this.keystore.getPrivateKey())
    env.sig = b64urlEncode(sig)
    const payload = canonicalJsonBytes(env as unknown as Record<string, unknown>)
    return "OESP1." + b64urlEncode(payload)
  }

  private parseToken(token: string): EnvelopeV1 {
    if (!token.startsWith("OESP1.")) throw new InvalidFormatError("Bad token prefix")
    try {
      const bin = b64urlDecode(token.slice(6))
      const json = new TextDecoder().decode(bin)
      return JSON.parse(json) as EnvelopeV1
    } catch (e: any) {
      throw new InvalidFormatError(String(e?.message || e))
    }
  }

  async unpack(token: string): Promise<DecodedMessage> {
    const env = this.parseToken(token)
    const now = Math.floor(Date.now() / 1000)
    if (env.exp < now) throw new ExpiredError()
    const mid = env.mid
    if (!mid) throw new InvalidFormatError("mid missing")
    if (await this.storage.hasMid(mid)) throw new ReplayError()
    const pubBytes = b64urlDecode(env.from.pub)
    const derived = deriveDid(pubBytes)
    if (derived !== env.from.did) throw new InvalidDIDError()
    const ctBytes = b64urlDecode(env.ct)
    const sigBytes = b64urlDecode(env.sig)
    const ok = verifyEd25519(this.dataToSign(env, ctBytes), sigBytes, pubBytes)
    if (!ok) throw new InvalidSignatureError()
    try {
      const ivBytes = b64urlDecode(env.iv)
      const ekBytes = b64urlDecode(env.ek)
      const xPriv = await (this.keystore as any).getX25519Private?.()
      if (!xPriv) throw new InvalidFormatError("missing X25519 private key")
      const sessionKey = openSealedSessionKeyX25519(xPriv as Uint8Array, ekBytes)
      const aad = canonicalJsonBytes(env as unknown as Record<string, unknown>, ["ct", "sig", "iv"])
      const plaintext = aeadDecrypt(sessionKey, ivBytes, ctBytes, aad)
      await this.storage.storeMid(mid)
      return { mid: env.mid, sid: env.sid, ts: env.ts, exp: env.exp, from_did: env.from.did, to_did: env.to.did, plaintext }
    } catch (e: any) {
      throw new DecryptionFailedError(String(e?.message || e))
    }
  }

  async verify(token: string): Promise<VerifiedEnvelope> {
    const env = this.parseToken(token)
    const now = Math.floor(Date.now() / 1000)
    if (env.exp < now) return { envelope: env, verified: false, signer_did: '' }
    try {
      const pubBytes = b64urlDecode(env.from.pub)
      const ctBytes = b64urlDecode(env.ct)
      const sigBytes = b64urlDecode(env.sig)
      const ok = verifyEd25519(this.dataToSign(env, ctBytes), sigBytes, pubBytes)
      const signer_did = deriveDid(pubBytes)
      return { envelope: env, verified: ok, signer_did }
    } catch {
      return { envelope: env, verified: false, signer_did: '' }
    }
  }
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const p of parts) { out.set(p, o); o += p.length }
  return out
}

function stableStringify(value: unknown): string {
  if (value === null) return 'null'
  const t = typeof value
  if (t === 'boolean') return value ? 'true' : 'false'
  if (t === 'number') return String(value)
  if (t === 'string') return JSON.stringify(value)
  if (value instanceof Uint8Array) return JSON.stringify(new TextDecoder().decode(value))
  if (Array.isArray(value)) return '[' + value.map(v => stableStringify(v)).join(',') + ']'
  if (t === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    const parts = keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k]))
    return '{' + parts.join(',') + '}'
  }
  return JSON.stringify(value)
}

function randomBytes(n: number): Uint8Array { return sodium.randombytes_buf(n) }

function randomBase64Url(n: number): string {
  return b64urlEncode(randomBytes(n))
}
