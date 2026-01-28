const { OESPClient } = require('../dist/client')
const { StorageMemory } = require('../dist/adapters/storage-sqlite')
const { ResolverMemory } = require('../dist/adapters/resolver-memory')
const sodium = require('./mocks/react-native-libsodium').default
const { __setSeed } = require('./mocks/react-native-libsodium')
const { b64urlEncode, b64urlDecode } = require('../dist/b64url')

class KeyStoreDeterministic {
  constructor(edSeed, xSeed) {
    const { privateKey, publicKey } = sodium.crypto_sign_seed_keypair(edSeed)
    this.edPriv = privateKey
    this.edPub = publicKey
    this.xPriv = xSeed
    this.xPub = sodium.crypto_scalarmult_base(xSeed)
  }
  async getPublicKey() { return this.edPub }
  async getPrivateKey() { return this.edPriv }
  async getX25519Public() { return this.xPub }
  async getX25519Private() { return this.xPriv }
  async sign(payload) { return sodium.crypto_sign_detached(payload, this.edPriv) }
  async encapsulate(peerPublicKey) {
    const ek = sodium.crypto_box_seal(new Uint8Array(32).fill(7), peerPublicKey)
    const iv = sodium.randombytes_buf(12)
    return { ek, key: new Uint8Array(32).fill(7), iv }
  }
}

const SEED_A = new Uint8Array(32).fill(0x41)
const SEED_B = new Uint8Array(32).fill(0x42)

test('roundtrip pack->unpack', async () => {
  __setSeed(new Uint8Array(32).fill(0x55))
  const storage = new StorageMemory()
  const resolver = new ResolverMemory()
  const sender = new KeyStoreDeterministic(SEED_A, SEED_A)
  const recipient = new KeyStoreDeterministic(SEED_B, SEED_B)
  const recipientClient = new OESPClient(recipient, storage, resolver)
  const recipientDid = await recipientClient.getDid()
  resolver.add(recipientDid, await recipient.getX25519Public())
  const senderClient = new OESPClient(sender, storage, resolver)
  const token = await senderClient.pack(recipientDid, { hello: 'world' })
  const decoded = await recipientClient.unpack(token)
  expect(new TextDecoder().decode(decoded.plaintext)).toBe('{"hello":"world"}')
})

test('reject expired', async () => {
  __setSeed(new Uint8Array(32).fill(0x56))
  const storage = new StorageMemory()
  const resolver = new ResolverMemory()
  const sender = new KeyStoreDeterministic(SEED_A, SEED_A)
  const recipient = new KeyStoreDeterministic(SEED_B, SEED_B)
  const recipientClient = new OESPClient(recipient, storage, resolver)
  const recipientDid = await recipientClient.getDid()
  resolver.add(recipientDid, await recipient.getX25519Public())
  const senderClient = new OESPClient(sender, storage, resolver)
  const token = await senderClient.pack(recipientDid, { hello: 'world' }, 0)
  const env = JSON.parse(new TextDecoder().decode(b64urlDecode(token.slice(6))))
  env.exp = Math.floor(Date.now() / 1000) - 1
  const token2 = 'OESP1.' + b64urlEncode(new TextEncoder().encode(JSON.stringify(env)))
  await expect(recipientClient.unpack(token2)).rejects.toBeInstanceOf(Error)
})

test('bad signature', async () => {
  __setSeed(new Uint8Array(32).fill(0x57))
  const storage = new StorageMemory()
  const resolver = new ResolverMemory()
  const sender = new KeyStoreDeterministic(SEED_A, SEED_A)
  const recipient = new KeyStoreDeterministic(SEED_B, SEED_B)
  const recipientClient = new OESPClient(recipient, storage, resolver)
  const recipientDid = await recipientClient.getDid()
  resolver.add(recipientDid, await recipient.getX25519Public())
  const senderClient = new OESPClient(sender, storage, resolver)
  const token = await senderClient.pack(recipientDid, { hello: 'world' })
  const env = JSON.parse(new TextDecoder().decode(b64urlDecode(token.slice(6))))
  const ctBytes = b64urlDecode(env.ct)
  env.ct = b64urlEncode(new Uint8Array([0x99, ...ctBytes]))
  const token2 = 'OESP1.' + b64urlEncode(new TextEncoder().encode(JSON.stringify(env)))
  await expect(recipientClient.unpack(token2)).rejects.toBeInstanceOf(Error)
})

test('ignore dup_mid', async () => {
  __setSeed(new Uint8Array(32).fill(0x58))
  const storage = new StorageMemory()
  const resolver = new ResolverMemory()
  const sender = new KeyStoreDeterministic(SEED_A, SEED_A)
  const recipient = new KeyStoreDeterministic(SEED_B, SEED_B)
  const recipientClient = new OESPClient(recipient, storage, resolver)
  const recipientDid = await recipientClient.getDid()
  resolver.add(recipientDid, await recipient.getX25519Public())
  const senderClient = new OESPClient(sender, storage, resolver)
  const token = await senderClient.pack(recipientDid, { hello: 'world' })
  await recipientClient.unpack(token)
  await expect(recipientClient.unpack(token)).rejects.toBeInstanceOf(Error)
})

