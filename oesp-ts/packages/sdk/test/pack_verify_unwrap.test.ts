import { describe, it, expect } from 'vitest';
import { OESPClient } from '../src/index';
import { MemoryReplayStore } from '@oesp/storage-memory';
import { SodiumCryptoProvider } from '@oesp/crypto-sodium';

class InMemoryKeyStore {
  private id?: { ed25519Priv: Uint8Array; ed25519Pub: Uint8Array; x25519Priv: Uint8Array; x25519Pub: Uint8Array };
  async getOrCreateIdentity() {
    const sodium = (await import('libsodium-wrappers-sumo')).default;
    await sodium.ready;
    if (!this.id) {
      const ed = sodium.crypto_sign_keypair();
      const x = sodium.crypto_kx_keypair();
      this.id = { ed25519Priv: ed.privateKey, ed25519Pub: ed.publicKey, x25519Priv: x.privateKey, x25519Pub: x.publicKey };
    }
    return this.id!;
  }
}

describe('pack->verify->unpack', () => {
  it('works', async () => {
    const crypto = new SodiumCryptoProvider();
    const ks = new InMemoryKeyStore();
    const replay = new MemoryReplayStore();
    const client = new OESPClient({ crypto, keystore: ks, replay });
    const did = await client.getDid();
    const token = await client.pack(did, { data: 123 });
    const v = await client.verify(token);
    expect(v.verified).toBe(true);
    const d = await client.unpack(token);
    const txt = new TextDecoder().decode(d.plaintext);
    expect(txt).toBe('{"data":123}');
  });
});
