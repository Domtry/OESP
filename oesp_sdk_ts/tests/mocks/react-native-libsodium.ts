import crypto from 'node:crypto'

let seed = Buffer.alloc(32, 0x11)
export function __setSeed(s: Uint8Array) { seed = Buffer.from(s) }

function prng(len: number): Uint8Array {
  const out = Buffer.alloc(len)
  for (let i = 0; i < len; i++) out[i] = seed[i % seed.length]
  return new Uint8Array(out)
}

function sha256(data: Uint8Array): Uint8Array {
  const h = crypto.createHash('sha256')
  h.update(Buffer.from(data))
  return new Uint8Array(h.digest())
}

function toBase64UrlNoPad(b: Uint8Array): string {
  return Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64UrlNoPad(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  return new Uint8Array(Buffer.from(base64, 'base64'))
}

function signDetached(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
  // Not actual Ed25519; use HMAC-SHA256 as placeholder for deterministic tests
  const h = crypto.createHmac('sha256', Buffer.from(privateKey))
  h.update(Buffer.from(message))
  return new Uint8Array(h.digest())
}

function verifyDetached(sig: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
  // Verify using same HMAC with pubKey as key for placeholder
  const h = crypto.createHmac('sha256', Buffer.from(publicKey))
  h.update(Buffer.from(message))
  const d = new Uint8Array(h.digest())
  return Buffer.compare(Buffer.from(d), Buffer.from(sig)) === 0
}

const sodium = {
  randombytes_buf: (len: number) => prng(len),
  crypto_sign_keypair: () => ({ publicKey: prng(32), privateKey: prng(32) }),
  crypto_sign_seed_keypair: (seed: Uint8Array) => ({ publicKey: new Uint8Array(seed), privateKey: new Uint8Array(seed) }),
  crypto_sign_detached: signDetached,
  crypto_sign_verify_detached: verifyDetached,
  crypto_box_seal: (message: Uint8Array, recipientPublicKey: Uint8Array) => new Uint8Array(message),
  crypto_box_seal_open: (ciphertext: Uint8Array, _publicKey: Uint8Array, _privateKey: Uint8Array) => new Uint8Array(ciphertext),
  crypto_aead_chacha20poly1305_ietf_encrypt: (message: Uint8Array, _aad: Uint8Array|null, _nsec: null, _nonce: Uint8Array, _key: Uint8Array) => new Uint8Array(message),
  crypto_aead_chacha20poly1305_ietf_decrypt: (ciphertext: Uint8Array, _aad: Uint8Array|null, _nsec: null, _nonce: Uint8Array, _key: Uint8Array) => new Uint8Array(ciphertext),
  crypto_hash_sha256: (message: Uint8Array) => sha256(message),
  crypto_scalarmult_base: (secretKey: Uint8Array) => new Uint8Array(secretKey),
  to_base64: toBase64UrlNoPad,
  from_base64: fromBase64UrlNoPad,
  base64_variants: { URLSAFE_NO_PADDING: 5 }
}

export default sodium

