import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalJsonBytes } from '../src/canonical.js'

describe('canonicalJsonBytes', () => {
  it('sorts keys and excludes', () => {
    const obj = { b: 1, a: 2, nested: { y: 0, x: 1 }, sig: 'x' }
    const s = canonicalJsonBytes(obj, ['sig'])
    assert.equal(new TextDecoder().decode(s), '{"a":2,"b":1,"nested":{"x":1,"y":0}}')
  })
})
