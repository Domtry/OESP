import { promises as fs } from 'fs';
import sodium from 'libsodium-wrappers-sumo';
import type { KeyStore, Identity } from '@oesp/sdk';

export class NodeFileKeyStore implements KeyStore {
  private path: string;
  constructor(path: string) {
    this.path = path;
  }

  async getOrCreateIdentity(): Promise<Identity> {
    await sodium.ready;
    try {
      const buf = await fs.readFile(this.path);
      const json = JSON.parse(buf.toString('utf-8'));
      return {
        ed25519Priv: Uint8Array.from(json.ed25519Priv),
        ed25519Pub: Uint8Array.from(json.ed25519Pub),
        x25519Priv: Uint8Array.from(json.x25519Priv),
        x25519Pub: Uint8Array.from(json.x25519Pub)
      };
    } catch {
      const ed = sodium.crypto_sign_keypair();
      const x = sodium.crypto_kx_keypair(); // curve25519 keypair
      const id: Identity = {
        ed25519Priv: ed.privateKey,
        ed25519Pub: ed.publicKey,
        x25519Priv: x.privateKey,
        x25519Pub: x.publicKey
      };
      await fs.mkdir(require('path').dirname(this.path), { recursive: true });
      await fs.writeFile(this.path, JSON.stringify({
        ed25519Priv: Array.from(id.ed25519Priv),
        ed25519Pub: Array.from(id.ed25519Pub),
        x25519Priv: Array.from(id.x25519Priv),
        x25519Pub: Array.from(id.x25519Pub)
      }));
      return id;
    }
  }
}
