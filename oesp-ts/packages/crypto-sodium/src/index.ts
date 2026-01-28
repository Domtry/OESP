import sodium from 'libsodium-wrappers-sumo';
import type { CryptoProvider } from '@oesp/sdk';

export class SodiumCryptoProvider implements CryptoProvider {
  private ready: Promise<void>;
  constructor() {
    this.ready = sodium.ready;
  }

  private ensureReady = async () => { await this.ready; };

  sha256(bytes: Uint8Array): Uint8Array {
    return sodium.crypto_hash_sha256(bytes);
  }
  ed25519Sign(priv: Uint8Array, data: Uint8Array): Uint8Array {
    return sodium.crypto_sign_detached(data, priv);
  }
  ed25519Verify(pub: Uint8Array, data: Uint8Array, sig: Uint8Array): boolean {
    return sodium.crypto_sign_verify_detached(sig, data, pub);
  }
  x25519Seal(recipientPub: Uint8Array, sessionKey: Uint8Array): Uint8Array {
    // Use sealed box to wrap sessionKey (demo)
    const sk = sodium.crypto_box_seal(sessionKey, recipientPub);
    return sk;
  }
  x25519Open(recipientPriv: Uint8Array, sealed: Uint8Array): Uint8Array {
    // For sealed box, we need recipient keypair; derive public from priv using sodium
    const pub = sodium.crypto_scalarmult_base(recipientPriv);
    const opened = sodium.crypto_box_seal_open(sealed, pub, recipientPriv);
    return opened;
  }
  aeadEncrypt(key: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): { iv: Uint8Array; ct: Uint8Array; tag?: Uint8Array } {
    const iv = sodium.randombytes_buf(sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES);
    const ct = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(plaintext, aad, null, iv, key);
    // Sodium returns ciphertext+tag together; we keep it as ct
    return { iv, ct };
  }
  aeadDecrypt(key: Uint8Array, iv: Uint8Array, ct: Uint8Array, aad: Uint8Array): Uint8Array {
    return sodium.crypto_aead_chacha20poly1305_ietf_decrypt(null, ct, aad, iv, key);
  }
  randomBytes(n: number): Uint8Array {
    return sodium.randombytes_buf(n);
  }
}

export async function createSodiumCryptoProvider(): Promise<SodiumCryptoProvider> {
  await sodium.ready;
  return new SodiumCryptoProvider();
}
