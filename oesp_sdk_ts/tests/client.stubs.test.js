import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { OESPClient } from '../src/client.js'

const ks = { getPublicKey: async () => new Uint8Array(), getPrivateKey: async () => new Uint8Array(), sign: async () => new Uint8Array(), encapsulate: async () => ({ ek: new Uint8Array(), key: new Uint8Array(), iv: new Uint8Array() }) }
const st = { hasMid: async () => false, storeMid: async () => {} }
const rs = { resolveDid: async () => new Uint8Array() }

describe('dataToSign', () => {
  it('concats correctly', () => {
    const c = new OESPClient(ks, st, rs)
    const env = { v: 1, typ: 'msg', mid: 'm', sid: 's', ts: 0, exp: 1, from: { did: 'd1', pub: 'p1' }, to: { did: 'd2' }, enc: 'CHACHA20-POLY1305', kex: 'X25519', ek: 'e', iv: 'i', ct: 'c', sig_alg: 'Ed25519', sig: '' }
    const out = c.dataToSign(env, new Uint8Array([1,2,3]))
    assert.equal(out.slice(-3).join(','), '1,2,3')
  })
})

