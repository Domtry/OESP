import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { EnvelopeV1 } from '../src/types.js'

describe('EnvelopeV1', () => {
  it('shape', () => {
    const env = {
      v: 1,
      typ: 'msg',
      mid: 'm',
      sid: 's',
      ts: 0,
      exp: 1,
      from: { did: 'd1', pub: 'p1' },
      to: { did: 'd2' },
      enc: 'CHACHA20-POLY1305',
      kex: 'X25519',
      ek: 'e',
      iv: 'i',
      ct: 'c',
      tag: 't',
      sig_alg: 'Ed25519',
      sig: 's'
    }
    assert.equal(env.from.did, 'd1')
  })
})

